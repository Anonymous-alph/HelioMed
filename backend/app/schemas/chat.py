import uuid

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    consultation_id: uuid.UUID | None = None
    create_consultation: bool = False


class ChatResponse(BaseModel):
    response: str
    sessionId: str
    consultation_id: uuid.UUID | None = None
    title: str | None = None


class ChatHistoryMessage(BaseModel):
    role: str
    content: str
