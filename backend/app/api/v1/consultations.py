import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.consultation import (
    ConsultationDetailResponse,
    ConsultationResponse,
    ConsultationUpdate,
    KeyPoints,
    MedicineItem,
    NotesRequest,
    PrescriptionData,
    TranscribeResponse,
)
from app.schemas.user import CurrentUser
from app.services.prescription_agent import extract_prescription
from app.services.summary_agent import generate_summary
from app.services.title_agent import generate_title
from app.services.transcription import transcribe_audio

router = APIRouter(prefix="/consultations", tags=["consultations"])


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    file: UploadFile,
    patient_id: str | None = Form(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await file.read()
    mime_type = file.content_type or "audio/webm"

    transcript = await transcribe_audio(audio_bytes, mime_type)

    prescription_result, summary_result, title = await asyncio.gather(
        extract_prescription(transcript),
        generate_summary(transcript),
        generate_title(transcript),
    )

    resolved_patient_id = uuid.UUID(patient_id) if patient_id else current_user.id

    # Look up the actual patient name (current_user is the doctor)
    if patient_id:
        patient_result = await db.execute(
            select(User.name).where(User.id == resolved_patient_id)
        )
        patient_name = patient_result.scalar_one_or_none() or ""
    else:
        patient_name = current_user.name or ""

    key_points_data = KeyPoints(
        symptoms=prescription_result.symptoms,
        diagnosis=prescription_result.diagnosis,
        allergies=prescription_result.allergies,
        notes=prescription_result.notes,
    )

    consultation = Consultation(
        doctor_id=current_user.id,
        patient_id=resolved_patient_id,
        transcript=transcript,
        title=title,
        status="completed",
        summary=summary_result.model_dump(),
        key_points=key_points_data.model_dump(),
        consent_given_at=datetime.now(timezone.utc),
    )
    db.add(consultation)
    await db.flush()

    prescription_record = Prescription(
        consultation_id=consultation.id,
        diagnosis=", ".join(prescription_result.diagnosis),
        medicines=[m.model_dump() for m in prescription_result.medicines],
        instructions=prescription_result.instructions,
    )
    db.add(prescription_record)
    await db.commit()

    return TranscribeResponse(
        consultation_id=consultation.id,
        transcript=transcript,
        keyPoints=key_points_data,
        prescription=PrescriptionData(
            patientName=patient_name,
            date=datetime.now(timezone.utc).isoformat(),
            medicines=[
                MedicineItem(
                    name=m.name,
                    dosage=m.dosage,
                    frequency=m.frequency,
                    duration=m.duration,
                )
                for m in prescription_result.medicines
            ],
            instructions=prescription_result.instructions,
        ),
        summary=summary_result,
    )


@router.get("/", response_model=list[ConsultationResponse])
async def list_consultations(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id
    result = await db.execute(
        select(Consultation)
        .where(
            (Consultation.doctor_id == user_id) | (Consultation.patient_id == user_id)
        )
        .order_by(Consultation.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{consultation_id}", response_model=ConsultationDetailResponse)
async def get_consultation(
    consultation_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Consultation)
        .where(Consultation.id == consultation_id)
        .options(selectinload(Consultation.prescriptions))
    )
    consultation = result.scalar_one_or_none()
    if consultation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    user_id = current_user.id
    if consultation.doctor_id != user_id and consultation.patient_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return consultation


@router.patch("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation(
    consultation_id: uuid.UUID,
    body: ConsultationUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Consultation).where(Consultation.id == consultation_id)
    )
    consultation = result.scalar_one_or_none()
    if consultation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    if consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if body.transcript is not None:
        consultation.transcript = body.transcript
    if body.status is not None:
        consultation.status = body.status
    await db.commit()
    await db.refresh(consultation)
    return consultation


@router.delete("/{consultation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consultation(
    consultation_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Consultation).where(Consultation.id == consultation_id)
    )
    consultation = result.scalar_one_or_none()
    if consultation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    if consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    await db.delete(consultation)
    await db.commit()


@router.post("/{consultation_id}/notes", response_model=ConsultationResponse)
async def save_consultation_notes(
    consultation_id: uuid.UUID,
    body: NotesRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Consultation).where(Consultation.id == consultation_id)
    )
    consultation = result.scalar_one_or_none()
    if consultation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    user_id = current_user.id
    if consultation.doctor_id != user_id and consultation.patient_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    author = current_user.name or current_user.email
    note_entry = f"[{timestamp} — {author}]\n{body.notes}"

    if consultation.notes:
        consultation.notes = consultation.notes + "\n---\n" + note_entry
    else:
        consultation.notes = note_entry

    await db.commit()
    await db.refresh(consultation)
    return consultation
