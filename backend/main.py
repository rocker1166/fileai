import os
import uuid
import shutil
import tempfile
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import aiofiles
import requests

from supabase import create_client, Client
from models.schemas import AskRequest, UploadResponse, QAResponse, DocumentMetadata

from utils.pdf_utils import extract_pages, chunk_pages
from utils.vector_store import build_supabase_index, get_supabase_retriever
from utils.llm_utils import get_qa_chain

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

@app.post("/upload_pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # 1. Save incoming PDF to temp
        tmp_path = await save_tmp(file)
        doc_id = uuid.uuid4().hex

        # 2. Extract text & chunk
        pages = extract_pages(tmp_path)
        chunks = chunk_pages(pages)

        # 3. Build Supabase vector index
        try:
            build_supabase_index(doc_id, chunks)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Indexing error: {e}")

        # 4. Upload PDF via REST (bypassing RLS)
        try:
            upload_to_supabase_storage(tmp_path, doc_id, file.content_type)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage upload error: {e}")

        # 5. Record metadata in Supabase
        # Join chunk texts to create full document content
        full_content = " ".join([c["text"] for c in chunks])
        res = supabase.table("documents").insert({
            "id": doc_id,
            "filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat(),
            "content": full_content  # Add the content field here
        }).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail=f"DB metadata insert failed: {res.get('error', 'Unknown error')}")

        return UploadResponse(
            document_id=doc_id,
            filename=file.filename,
            message="Upload and indexing successful"
        )
    finally:
        # Cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/ask_question", response_model=QAResponse)
async def ask_question(req: AskRequest):
    # Load Supabase retriever
    try:
        retriever = get_supabase_retriever(req.document_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Document index not found.")

    qa_chain = get_qa_chain(retriever)
    
    # Use invoke() instead of __call__
    result = qa_chain.invoke({"query": req.question})
    
    answer = result.get("result", "")
    docs = result.get("source_documents", [])

    pages = sorted({int(d.metadata.get("page", 0)) for d in docs})
    context_snippets = [
        {"page": d.metadata.get("page"), "text": d.page_content}
        for d in docs
    ]

    # Log the Q&A
    supabase.table("questions").insert({
        "document_id": req.document_id,
        "question": req.question,
        "answer": answer,
        "asked_at": datetime.utcnow().isoformat()
    }).execute()

    return QAResponse(answer=answer, source_pages=pages, context_snippets=context_snippets)

@app.get("/documents", response_model=list[DocumentMetadata])
def list_documents():
    res = supabase.table("documents").select("*").execute()
    return res.data

@app.get("/document/{doc_id}")
def get_document(doc_id: str):
    doc = supabase.table("documents").select("*").eq("id", doc_id).single().execute()
    if doc.status_code != 200:
        raise HTTPException(status_code=404, detail="Document not found.")
    history = supabase.table("questions").select("question,answer,asked_at").eq("document_id", doc_id).execute()
    return {"metadata": doc.data, "qa_history": history.data}

@app.delete("/document/{doc_id}")
def delete_document(doc_id: str):
    # Delete from storage via SDK is fine for deletes
    supabase.storage.from_("pdfs").remove([f"{doc_id}.pdf"])
    # Remove metadata
    supabase.table("documents").delete().eq("id", doc_id).execute()
    supabase.table("questions").delete().eq("document_id", doc_id).execute()
    return JSONResponse({"message": "Document and related data deleted."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
