from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.schema.retriever import BaseRetriever
from langchain_community.cache import InMemoryCache
from langchain.globals import set_llm_cache
from typing import Optional, List
import os

# Set up caching to avoid redundant API calls
set_llm_cache(InMemoryCache())

# Initialize your Gemini-backed chat model with correct model name format
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", 
    temperature=0.2,
    disable_streaming=False,  # Correct parameter name is disable_streaming
    max_retries=2,  # Ensure resilience without excessive retries
    timeout=30,     # Set reasonable timeout
    cache=True      # Enable result caching
)

def get_qa_chain(
    retriever: BaseRetriever,
    return_source_documents: bool = True
) -> RetrievalQA:
    """
    Returns an optimized RetrievalQA chain using the Gemini LLM.
    
    Args:
        retriever: The document retriever to use
        return_source_documents: Whether to return source documents in the response
        
    Returns:
        An optimized QA chain
    """
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=return_source_documents,
        verbose=False
    )

def get_concurrent_qa_chain(
    retriever: BaseRetriever,
    k: int = 4
) -> RetrievalQA:
    """
    Returns a RetrievalQA chain with optimized document retrieval for better performance.
    
    Args:
        retriever: The document retriever to use
        k: Number of documents to retrieve
        
    Returns:
        A QA chain with optimized retrieval
    """
    # Configure retriever with appropriate parameters based on its type
    if hasattr(retriever, "search_kwargs"):
        # Check if this is a SupabaseVectorStore retriever 
        retriever_type = str(type(retriever.vectorstore))
        
        # Supabase vector store doesn't support 'fetch_k' or 'concurrent' parameters
        if "Supabase" in retriever_type:
            # Only update k parameter for Supabase
            retriever.search_kwargs.update({"k": k})
        else:
            # For other retrievers that might support these parameters
            retriever.search_kwargs.update({
                "k": k, 
                "concurrent": True,
                "fetch_k": k * 2
            })
    
    return get_qa_chain(retriever)

def create_optimized_prompt(question: str) -> str:
    """
    Creates an optimized prompt that helps the model respond more efficiently.
    
    Args:
        question: The user's question
        
    Returns:
        Optimized prompt for faster, more focused responses
    """
    return f"""You are a precise and context-aware assistant built to help users find accurate information from their uploaded PDF documents. {question} is the user's question. Your task is to provide a concise and accurate answer based on the context provided. If the answer is not available in the context, respond with "The information is not available in the provided context."

🟢 Introduction Rule
If the user asks who you are or requests an introduction, respond with this only once per session:
"Hi! I'm a chat assistant built to help you find information from your uploaded documents. I was created by Suman Jana — check out his portfolio at sumanjana.xyz."

📌 Core Response Rules

Always check the retrieved context first.

Only use information from the context for fact-based questions.
    – If the answer isn't present, say: "The information is not available in the provided context."

Never alter facts or make assumptions beyond what is explicitly stated.

Use your own knowledge only when absolutely necessary, and only if the context is clearly insufficient.
– Never contradict the context.

Adapt answer length to the question type:
    – Be brief for short or simple questions.
    – Be detailed for complex or long-form questions.

Avoid repeating information the user already knows or that you've already said.

If the user insists multiple times for an answer not in the context, you may use prior knowledge — but clearly state:
Based on general knowledge, not from the provided context."""
