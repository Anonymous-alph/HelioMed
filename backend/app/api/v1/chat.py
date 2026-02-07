import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.chat_message import ChatMessage
from app.models.consultation import Consultation
from app.schemas.chat import ChatHistoryMessage, ChatRequest, ChatResponse
from app.schemas.user import CurrentUser
from app.services.chat_agent import get_chat_response
from app.services.title_agent import generate_title

router = APIRouter(prefix="/chat", tags=["chat"])


def build_consultation_context(consultation: Consultation) -> str:
    parts = [
        "You have access to the following consultation record for this patient. "
        "Use this context to provide specific, relevant answers about their care.\n"
    ]

    if consultation.transcript:
        parts.append(f"## Transcript\n{consultation.transcript}\n")

    for rx in consultation.prescriptions:
        if rx.diagnosis:
            parts.append(f"## Diagnosis\n{rx.diagnosis}\n")
        if rx.medicines:
            med_lines = []
            for m in rx.medicines:
                name = m.get("name", "")
                dosage = m.get("dosage", "")
                frequency = m.get("frequency", "")
                duration = m.get("duration", "")
                med_lines.append(f"- {name} {dosage}, {frequency} for {duration}")
            parts.append("## Medicines\n" + "\n".join(med_lines) + "\n")
        if rx.instructions:
            instr = rx.instructions if isinstance(rx.instructions, list) else [rx.instructions]
            parts.append("## Instructions\n" + "\n".join(f"- {i}" for i in instr) + "\n")

    return "\n".join(parts)


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_id = body.session_id or str(uuid.uuid4())
    user_id = current_user.id

    # Create new consultation from chat if requested
    new_consultation_id: uuid.UUID | None = None
    new_title: str | None = None
    if body.create_consultation and not body.consultation_id:
        new_title = await generate_title(body.message)
        new_consultation = Consultation(
            doctor_id=user_id,
            patient_id=user_id,
            title=new_title,
            status="chat",
            consent_given_at=datetime.now(timezone.utc),
        )
        db.add(new_consultation)
        await db.flush()
        new_consultation_id = new_consultation.id
        body.consultation_id = new_consultation_id

    # Build consultation context if requested
    consultation_context: str | None = None
    if body.consultation_id:
        result = await db.execute(
            select(Consultation)
            .where(Consultation.id == body.consultation_id)
            .options(selectinload(Consultation.prescriptions))
        )
        consultation = result.scalar_one_or_none()
        if consultation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
        if consultation.doctor_id != user_id and consultation.patient_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        consultation_context = build_consultation_context(consultation)

    # Load history from DB
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.patient_id == user_id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.created_at.asc())
    )
    history_rows = result.scalars().all()

    # Build pydantic-ai message_history from DB rows
    from pydantic_ai.messages import (
        ModelRequest,
        ModelResponse,
        TextPart,
        UserPromptPart,
    )

    message_history: list = []
    for row in history_rows:
        if row.role == "user":
            message_history.append(
                ModelRequest(parts=[UserPromptPart(content=row.content)])
            )
        else:
            message_history.append(
                ModelResponse(parts=[TextPart(content=row.content)])
            )

    # Persist user message immediately so it's saved even if AI fails
    user_msg = ChatMessage(
        patient_id=user_id,
        session_id=session_id,
        role="user",
        content=body.message,
        consultation_id=body.consultation_id,
    )
    db.add(user_msg)
    await db.commit()

    # Get AI response
    response_text = await get_chat_response(body.message, message_history, consultation_context)

    # Persist assistant message
    assistant_msg = ChatMessage(
        patient_id=user_id,
        session_id=session_id,
        role="assistant",
        content=response_text,
        consultation_id=body.consultation_id,
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        response=response_text,
        sessionId=session_id,
        consultation_id=new_consultation_id,
        title=new_title,
    )


@router.get("/history", response_model=list[ChatHistoryMessage])
async def get_chat_history(
    session_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.patient_id == current_user.id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return [ChatHistoryMessage(role=m.role, content=m.content) for m in messages]
