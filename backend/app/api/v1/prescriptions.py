import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.schemas.consultation import (
    KeyPoints,
    MedicineItem,
    PrescriptionData,
    TranscribeResponse,
)
from app.schemas.prescription import PrescriptionResponse, PrescriptionUpdate
from app.schemas.user import CurrentUser
from app.services.image_analysis_agent import (
    ACCEPTED_IMAGE_TYPES,
    extract_prescription_from_image,
    generate_summary_from_image,
    generate_title_from_image,
)
from app.services.prescription_agent import extract_prescription

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


async def _check_consultation_access(
    consultation: Consultation, user_id: uuid.UUID
) -> None:
    if consultation.doctor_id != user_id and consultation.patient_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


@router.post("/generate", response_model=PrescriptionResponse)
async def generate_prescription(
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
    await _check_consultation_access(consultation, current_user.id)
    if not consultation.transcript:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcript available")

    agent_result = await extract_prescription(consultation.transcript)

    prescription = Prescription(
        consultation_id=consultation.id,
        diagnosis=", ".join(agent_result.diagnosis),
        medicines=[m.model_dump() for m in agent_result.medicines],
        instructions=agent_result.instructions,
    )
    db.add(prescription)
    await db.commit()
    await db.refresh(prescription)
    return prescription


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    consult_result = await db.execute(
        select(Consultation).where(Consultation.id == prescription.consultation_id)
    )
    consultation = consult_result.scalar_one()
    await _check_consultation_access(consultation, current_user.id)
    return prescription


@router.patch("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: uuid.UUID,
    body: PrescriptionUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    consult_result = await db.execute(
        select(Consultation).where(Consultation.id == prescription.consultation_id)
    )
    consultation = consult_result.scalar_one()
    if consultation.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if body.diagnosis is not None:
        prescription.diagnosis = body.diagnosis
    if body.medicines is not None:
        prescription.medicines = [m.model_dump() for m in body.medicines]
    if body.instructions is not None:
        prescription.instructions = body.instructions
    await db.commit()
    await db.refresh(prescription)
    return prescription


@router.post("/scan-image", response_model=TranscribeResponse)
async def scan_prescription_image(
    file: UploadFile,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze an uploaded prescription/medical document image."""
    content_type = file.content_type or "image/png"
    if content_type not in ACCEPTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {content_type}. Use PNG, JPEG, GIF, or WebP.",
        )

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image too large. Maximum size is 10MB.",
        )

    # Run all three vision agents in parallel
    prescription_result, summary_result, title = await asyncio.gather(
        extract_prescription_from_image(image_bytes, content_type),
        generate_summary_from_image(image_bytes, content_type),
        generate_title_from_image(image_bytes, content_type),
    )

    key_points_data = KeyPoints(
        symptoms=prescription_result.symptoms,
        diagnosis=prescription_result.diagnosis,
        allergies=prescription_result.allergies,
        notes=prescription_result.notes,
    )

    # Create consultation record (same as audio transcribe flow)
    consultation = Consultation(
        doctor_id=current_user.id,
        patient_id=current_user.id,
        title=title,
        status="completed",
        summary=summary_result.model_dump(),
        key_points=key_points_data.model_dump(),
        consent_given_at=datetime.now(timezone.utc),
    )
    db.add(consultation)
    await db.flush()

    # Create prescription record
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
        transcript=f"[Scanned from image: {file.filename or 'upload'}]",
        keyPoints=key_points_data,
        prescription=PrescriptionData(
            patientName=current_user.name or "",
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
