import os

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase import create_client
from typing import List, Dict
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

def build_supabase_index(
    document_id: str,
    chunks: List[Dict]
) -> None:
    """
    Given a list of {"page": int, "text": str}, build & save a Supabase index.
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

    # This will handle the vector embeddings and storage
    SupabaseVectorStore.from_texts(
        texts,
        embeddings,
        metadatas=metadatas,
        client=supabase_client,
        table_name=VECTOR_TABLE,
        query_name=VECTOR_QUERY_FUNCTION
    )

def get_supabase_retriever(document_id: str):
    """
    Load a previously built Supabase index for a document_id.
    """
    return SupabaseVectorStore(
        embedding=embeddings,
        client=supabase_client,
        table_name=VECTOR_TABLE,
        query_name=VECTOR_QUERY_FUNCTION
    ).as_retriever(search_kwargs={"filter": {"document_id": document_id}})
