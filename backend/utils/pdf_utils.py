import fitz  # PyMuPDF
from typing import List, Dict


def extract_pages(path: str) -> List[Dict]:
    """
    Extracts text from each page of a PDF.
    Returns a list of {"page": int, "text": str}.
    """
    doc = fitz.open(path)
    pages = []
    for i in range(len(doc)):
        text = doc[i].get_text()
        pages.append({"page": i + 1, "text": text})
    doc.close()
    return pages


def chunk_pages(
    pages: List[Dict],
    chunk_size: int = 512,
    overlap: int = 50
) -> List[Dict]:
    """
    Splits page text into overlapping chunks of roughly chunk_size tokens.
    Returns list of {"document_id": ..., "page": int, "text": chunk_text}.
    Simple whitespace-based split; for production, use a proper tokenizer.
    """
    chunks = []
    for p in pages:
        words = p["text"].split()
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text = " ".join(words[start:end])
            chunks.append({"page": p["page"], "text": chunk_text})
            start += chunk_size - overlap
    return chunks
