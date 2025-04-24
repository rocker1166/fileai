import os
import hashlib
from functools import lru_cache
import concurrent.futures

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore, FAISS
from supabase import create_client
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Initialize embeddings with explicit API key
google_api_key = os.environ.get("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

# Use the correct model name format with full path for embeddings
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",  # Use the fully qualified model name
    google_api_key=google_api_key,
)

# Use a separate table for vector embeddings
VECTOR_TABLE = "document_vectors"
VECTOR_QUERY_FUNCTION = "match_document_vectors"

# In-memory cache for frequently accessed retriever instances
retriever_cache = {}

def _chunk_processor(chunk_batch):
    """Process a batch of chunks for parallel embedding"""
    return embeddings.embed_documents([c["text"] for c in chunk_batch])

def build_supabase_index(
    document_id: str,
    chunks: List[Dict],
    batch_size: int = 20
) -> None:
    """
    Given a list of {"page": int, "text": str}, build & save a Supabase index.
    Uses batching and parallelization for faster processing.
    
    Args:
        document_id: Unique ID for the document
        chunks: List of text chunks with page numbers
        batch_size: Number of chunks to process in parallel
    """
    texts = [c["text"] for c in chunks]
    
    # Include only necessary metadata to avoid conflicts
    metadatas = [
        {
            "document_id": document_id, 
            "page": c["page"]
        } 
        for c in chunks
    ]

    # Process in batches for better efficiency
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_meta = metadatas[i:i + batch_size]
        
        # This will handle the vector embeddings and storage
        SupabaseVectorStore.from_texts(
            batch_texts,
            embeddings,
            metadatas=batch_meta,
            client=supabase_client,
            table_name=VECTOR_TABLE,
            query_name=VECTOR_QUERY_FUNCTION
        )

@lru_cache(maxsize=10)
def get_supabase_retriever(document_id: str, k: int = 4):
    """
    Load a previously built Supabase index for a document_id.
    Uses caching to avoid recreating retrievers for the same document.
    
    Args:
        document_id: Unique ID for the document
        k: Number of documents to retrieve (default: 4)
    
    Returns:
        A document retriever configured for the specified document
    """
    # Check if we have a cached retriever for this document
    cache_key = f"{document_id}_{k}"
    if cache_key in retriever_cache:
        return retriever_cache[cache_key]
    
    # Create a new retriever if not cached
    retriever = SupabaseVectorStore(
        embedding=embeddings,
        client=supabase_client,
        table_name=VECTOR_TABLE,
        query_name=VECTOR_QUERY_FUNCTION
    ).as_retriever(search_kwargs={
        "filter": {"document_id": document_id},
        "k": k
        # Removed fetch_k parameter as it's not supported by SupabaseVectorStore
    })
    
    # Cache the retriever
    retriever_cache[cache_key] = retriever
    return retriever

def create_local_index(document_id: str, chunks: List[Dict]):
    """
    Create a local FAISS index for faster testing and development.
    This can be used as a fallback when Supabase is slow.
    
    Args:
        document_id: Unique ID for the document
        chunks: List of text chunks with page numbers
    
    Returns:
        A FAISS vector store
    """
    texts = [c["text"] for c in chunks]
    metadatas = [{"document_id": document_id, "page": c["page"]} for c in chunks]
    
    return FAISS.from_texts(texts, embeddings, metadatas=metadatas)
