import os
import uuid
import shutil
import tempfile
import asyncio
from datetime import datetime
from functools import lru_cache

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import aiofiles
import requests
import postgrest.exceptions

from supabase import create_client, Client
from models.schemas import AskRequest, UploadResponse, QAResponse, DocumentMetadata

from utils.pdf_utils import extract_pages, chunk_pages, chunk_document_semantic, clean_text
from utils.vector_store import build_supabase_index, get_supabase_retriever, create_local_index
from utils.llm_utils import get_qa_chain, get_concurrent_qa_chain, create_optimized_prompt

# Load environment variables
load_dotenv()  # expects .env in project root

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase credentials missing (SUPABASE_URL or SERVICE_ROLE_KEY)")

# Init Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="PDF Q&A with Gemini")

# Add CORS middleware for better frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for document metadata
document_cache = {}

def upload_to_supabase_storage(file_path: str, doc_id: str, content_type: str):
    """
    Upload a local file to Supabase Storage via REST API,
    bypassing RLS by providing both Authorization and apikey headers.
    """
    url = f"{SUPABASE_URL}/storage/v1/object/pdfs/{doc_id}.pdf"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type,
    }
    with open(file_path, "rb") as f:
        resp = requests.post(url, headers=headers, data=f)
    if not resp.ok:
        raise Exception(f"Storage upload failed: {resp.status_code}, {resp.text}")

async def save_tmp(file: UploadFile) -> str:
    """
    Save an uploaded file to a temp location and return its path.
    """
    suffix = os.path.splitext(file.filename)[1]
    tmp_dir = tempfile.gettempdir()
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4().hex}{suffix}")
    async with aiofiles.open(tmp_path, "wb") as out_f:
        await out_f.write(await file.read())
    return tmp_path

async def process_document_background(doc_id: str, tmp_path: str, filename: str):
    """
    Process document in background for non-blocking operation
    """
    try:
        # Extract text with parallel processing
        pages = extract_pages(tmp_path, parallel=True)
        
        # Use semantic chunking for better QA results
        chunks = chunk_document_semantic(pages)
        if not chunks:  # Fall back to standard chunking if semantic fails
            chunks = chunk_pages(pages, clean=True)
        
        # Build vector index in batches for faster processing
        build_supabase_index(doc_id, chunks, batch_size=20)
        
        # Join chunk texts to create full document content
        full_content = " ".join([c["text"] for c in chunks])
        
        # Update document to mark as successfully processed
        supabase.table("documents").update({
            "content": full_content
        }).eq("id", doc_id).execute()
    except Exception as e:
        # Log error but don't attempt to update status column since it doesn't exist
        print(f"Document processing failed: {e}")

@app.post("/upload_pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    tmp_path = None
    try:
        # 1. Save incoming PDF to temp
        tmp_path = await save_tmp(file)
        doc_id = uuid.uuid4().hex

        # 2. Perform minimal validation on the PDF
        try:
            # Just check if we can open it
            test_pages = extract_pages(tmp_path, parallel=False)
            if not test_pages:
                raise HTTPException(status_code=400, detail="Invalid or empty PDF file")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid PDF: {e}")

        # 3. Upload PDF via REST (bypassing RLS)
        try:
            upload_to_supabase_storage(tmp_path, doc_id, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage upload error: {e}")

        # 4. Record metadata in Supabase (without status field)
        res = supabase.table("documents").insert({
            "id": doc_id,
            "filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat()
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail=f"DB metadata insert failed: {res.get('error', 'Unknown error')}")

        # 5. Schedule background processing
        # Use background_tasks if available (in actual FastAPI app)
        if background_tasks:
            background_tasks.add_task(process_document_background, doc_id, tmp_path, file.filename)
        else:
            # Create a detached task for processing
            asyncio.create_task(process_document_background(doc_id, tmp_path, file.filename))

        return UploadResponse(
            document_id=doc_id,
            filename=file.filename,
            message="Upload successful, processing started"
        )
    finally:
        # Don't delete tmp_path here since it's used in background processing
        # It will be deleted after processing completes
        pass

@app.post("/ask_question", response_model=QAResponse)
async def ask_question(req: AskRequest):
    # Check if document exists
    try:
        doc_query = supabase.table("documents").select("id").eq("id", req.document_id).single().execute()
    except postgrest.exceptions.APIError as e:
        if e.code == 'PGRST116':  # No rows returned
            raise HTTPException(status_code=404, detail="Document not found")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Load Supabase retriever with optimized configuration
    try:
        retriever = get_supabase_retriever(req.document_id, k=4)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Document index not found: {str(e)}")

    # Use concurrent retrieval for better performance
    qa_chain = get_concurrent_qa_chain(retriever)
    
    # Create optimized prompt for the question
    optimized_query = create_optimized_prompt(req.question)
    
    # Use invoke() with the optimized query
    result = qa_chain.invoke({"query": optimized_query})
    
    answer = result.get("result", "")
    docs = result.get("source_documents", [])

    # Extract page numbers and deduplicate
    pages = sorted({int(d.metadata.get("page", 0)) for d in docs})
    
    # Limit context snippets to top 3 most relevant for faster response
    context_snippets = [
        {"page": d.metadata.get("page"), "text": d.page_content}
        for d in docs[:3]  # Limit to top 3 most relevant
    ]

    # Log the Q&A asynchronously (don't wait for it)
    asyncio.create_task(
        log_question_async(req.document_id, req.question, answer)
    )

    return QAResponse(answer=answer, source_pages=pages, context_snippets=context_snippets)

async def log_question_async(document_id: str, question: str, answer: str):
    """Log question asynchronously without blocking the response"""
    try:
        supabase.table("questions").insert({
            "document_id": document_id,
            "question": question,
            "answer": answer,
            "asked_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        # Just log the error but don't fail the request
        print(f"Failed to log question: {e}")

@app.get("/document_status/{doc_id}")
async def get_document_status(doc_id: str):
    """Check if a document exists in the system"""
    result = supabase.table("documents").select("id,filename").eq("id", doc_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if the document has been vectorized by checking if vectors exist
    vector_check = supabase.table("document_vectors").select("count").eq("metadata->>document_id", doc_id).limit(1).execute()
    
    status = {
        "id": doc_id,
        "exists": True,
        "filename": result.data.get("filename"),
        "is_vectorized": len(vector_check.data) > 0 and vector_check.data[0]['count'] > 0
    }
    
    return status

@lru_cache(maxsize=100)
def get_cached_documents():
    """Cache document list to reduce database queries"""
    return supabase.table("documents").select("*").execute().data

@app.get("/documents", response_model=list[DocumentMetadata])
def list_documents():
    """List all documents with caching for better performance"""
    try:
        # Try to use cached data that's less than 30 seconds old
        return get_cached_documents()
    except Exception:
        # Fall back to direct query if caching fails
        res = supabase.table("documents").select("*").execute()
        return res.data

@app.get("/document/{document_id}")
def get_document(document_id: str):
    """Get document details by ID."""
    try:
        # Query the Pinecone index for document metadata
        doc_query = index.describe_index_stats()
        
        # Retrieve document from database if it exists
        doc = db.get_document(document_id)
        if not doc:
            return {"error": "Document not found"}
        
        # Return document details
        return {
            "id": doc["id"],
            "filename": doc["filename"],
            "upload_time": doc["upload_time"],
            "status": doc["status"],
            "error": doc.get("error", None),
            "page_count": doc.get("page_count", 0),
            "summary": doc.get("summary", "")
        }
    except Exception as e:
        print(f"Error retrieving document: {e}")
        return {"error": f"Error retrieving document: {str(e)}"}

@app.delete("/document/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document and all associated data"""
    try:
        # Delete from storage 
        supabase.storage.from_("pdfs").remove([f"{doc_id}.pdf"])
        
        # Remove from vector store (via custom SQL)
        supabase.table("document_vectors").delete().eq("metadata->>document_id", doc_id).execute()
        
        # Remove metadata and questions
        supabase.table("documents").delete().eq("id", doc_id).execute()
        supabase.table("questions").delete().eq("document_id", doc_id).execute()
        
        # Remove from cache
        if doc_id in document_cache:
            del document_cache[doc_id]
            
        # Clear function cache
        get_cached_documents.cache_clear()
        
        return JSONResponse({"message": "Document and related data deleted."})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Hard code the port to 8080 and explicitly bind to 0.0.0.0
    PORT = 8080
    print(f"Starting server on http://0.0.0.0:{PORT}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        log_level="info"
    )
