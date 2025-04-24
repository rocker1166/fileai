import fitz  # PyMuPDF
import concurrent.futures
import re
from typing import List, Dict, Optional


def extract_pages(path: str, parallel: bool = True) -> List[Dict]:
    """
    Extracts text from each page of a PDF with parallel processing.
    
    Args:
        path: Path to the PDF file
        parallel: Whether to use parallel processing
        
    Returns:
        List of {"page": int, "text": str}
    """
    doc = fitz.open(path)
    pages = []
    
    # For small documents, parallel processing may have overhead
    if parallel and len(doc) > 5:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Process pages in parallel
            future_to_page = {
                executor.submit(_extract_page_text, doc, i): i 
                for i in range(len(doc))
            }
            
            for future in concurrent.futures.as_completed(future_to_page):
                page_num = future_to_page[future]
                try:
                    text = future.result()
                    pages.append({"page": page_num + 1, "text": text})
                except Exception as e:
                    print(f"Error extracting page {page_num}: {e}")
        
        # Sort by page number since parallel processing may complete out of order
        pages.sort(key=lambda x: x["page"])
    else:
        # Sequential processing for small documents
        for i in range(len(doc)):
            text = doc[i].get_text()
            pages.append({"page": i + 1, "text": text})
    
    doc.close()
    return pages


def _extract_page_text(doc, page_num):
    """Helper function to extract text from a single page"""
    return doc[page_num].get_text()


def clean_text(text: str) -> str:
    """
    Clean up extracted text for better processing.
    
    Args:
        text: Raw text from PDF
        
    Returns:
        Cleaned text
    """
    # Replace multiple whitespace with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', text)
    return text.strip()


def chunk_pages(
    pages: List[Dict],
    chunk_size: int = 512,
    overlap: int = 50,
    clean: bool = True
) -> List[Dict]:
    """
    Splits page text into overlapping chunks of roughly chunk_size tokens.
    
    Args:
        pages: List of page dictionaries with text
        chunk_size: Size of each chunk in approximate tokens
        overlap: Number of overlapping tokens between chunks
        clean: Whether to clean the text before chunking
        
    Returns:
        List of {"page": int, "text": chunk_text}
    """
    chunks = []
    
    for p in pages:
        text = clean_text(p["text"]) if clean else p["text"]
        words = text.split()
        
        # Skip empty pages
        if not words:
            continue
            
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text = " ".join(words[start:end])
            
            # Skip empty chunks
            if chunk_text.strip():
                chunks.append({"page": p["page"], "text": chunk_text})
                
            start += chunk_size - overlap
            
    return chunks


def chunk_document_semantic(pages: List[Dict], max_chunk_size: int = 512) -> List[Dict]:
    """
    Alternative chunking method that tries to maintain semantic sections.
    Uses paragraph and section breaks instead of fixed-size chunks.
    
    Args:
        pages: List of page dictionaries with text
        max_chunk_size: Maximum size of each chunk in approximate tokens
        
    Returns:
        List of {"page": int, "text": chunk_text}
    """
    chunks = []
    
    for p in pages:
        text = p["text"]
        
        # Split by paragraphs (double newlines)
        paragraphs = re.split(r'\n\s*\n', text)
        current_chunk = ""
        current_length = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            para_length = len(para.split())
            
            # If this paragraph would make the chunk too big, store current chunk and start new one
            if current_length + para_length > max_chunk_size and current_chunk:
                chunks.append({"page": p["page"], "text": current_chunk.strip()})
                current_chunk = para
                current_length = para_length
            else:
                # Add to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
                current_length += para_length
        
        # Add any remaining text
        if current_chunk:
            chunks.append({"page": p["page"], "text": current_chunk.strip()})
    
    return chunks
