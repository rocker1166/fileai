from pydantic import BaseModel
from typing import List, Optional


class AskRequest(BaseModel):
    document_id: str
    question: str


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str


class QAResponse(BaseModel):
    answer: str
    source_pages: List[int]
    context_snippets: List[dict]
    message_id: str = None  # Add message_id to track feedback


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    uploaded_at: str


class QuestionRecord(BaseModel):
    question: str
    answer: str
    asked_at: str


class FeedbackRequest(BaseModel):
    message_id: str
    is_helpful: bool


class FeedbackResponse(BaseModel):
    success: bool
    message: str
