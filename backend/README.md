# PDF Q&A with Gemini API

A FastAPI-based service that allows users to upload PDF documents and ask questions about their content using Google's Gemini AI model. The service uses Supabase for storage and vector search capabilities.

## Features

- PDF document upload and processing
- Semantic search and question answering
- Document management (list, status, delete)
- Asynchronous document processing
- Vector embeddings for efficient search
- Caching for improved performance

## Prerequisites

- Python 3.8+
- Supabase account and credentials
- Google Gemini API key

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_API_KEY=your_gemini_api_key
```

## API Endpoints

### Upload PDF
```http
POST /upload_pdf
```
Upload a new PDF document for processing.

**Request:**
- Content-Type: multipart/form-data
- Body: file (PDF file)

**Response:**
```json
{
    "document_id": "string",
    "filename": "string",
    "message": "string"
}
```

### Ask Question
```http
POST /ask_question
```
Ask a question about a specific document.

**Request:**
```json
{
    "document_id": "string",
    "question": "string"
}
```

**Response:**
```json
{
    "answer": "string",
    "source_pages": [int],
    "context_snippets": [
        {
            "page": int,
            "text": "string"
        }
    ]
}
```

### Get Document Status
```http
GET /document_status/{doc_id}
```
Check the processing status of a document.

**Response:**
```json
{
    "id": "string",
    "exists": true,
    "filename": "string",
    "is_vectorized": true
}
```

### List Documents
```http
GET /documents
```
Get a list of all uploaded documents.

**Response:**
```json
[
    {
        "id": "string",
        "filename": "string",
        "uploaded_at": "string"
    }
]
```

### Delete Document
```http
DELETE /document/{doc_id}
```
Delete a document and all its associated data.

**Response:**
```json
{
    "message": "Document and related data deleted."
}
```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request (invalid PDF, etc.)
- 404: Document Not Found
- 500: Internal Server Error

Error responses include a detail message:
```json
{
    "detail": "Error message"
}
```

## Running the Server

Start the server with:
```bash
python main.py
```

The server will run on `http://localhost:8000` by default.

## CORS

CORS is enabled for all origins (`*`) by default. For production, configure the `allow_origins` parameter in the CORS middleware settings.