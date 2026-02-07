import uuid
from datetime import datetime

from pydantic import BaseModel


class KeyPoints(BaseModel):
    symptoms: list[str] = []
    diagnosis: list[str] = []
    allergies: list[str] = []
    notes: list[str] = []


class MedicineItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str


class PrescriptionData(BaseModel):
    patientName: str = ""
    date: str = ""
    medicines: list[MedicineItem] = []
    instructions: list[str] = []


class AssessmentItem(BaseModel):
    code: str
    description: str


class SummaryData(BaseModel):
    chiefComplaint: str = ""
    history: str = ""
    assessment: list[AssessmentItem] = []
    plan: list[str] = []


class ConsultationCreate(BaseModel):
    patient_id: uuid.UUID
    consent_given_at: datetime


class ConsultationUpdate(BaseModel):
    transcript: str | None = None
    status: str | None = None


class NotesRequest(BaseModel):
    notes: str


class ConsultationResponse(BaseModel):
    id: uuid.UUID
    doctor_id: uuid.UUID
    patient_id: uuid.UUID
    title: str | None = None
    transcript: str | None = None
    status: str
    notes: str | None = None
    summary: dict | None = None
    key_points: dict | None = None
    consent_given_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionInline(BaseModel):
    id: uuid.UUID
    diagnosis: str | None = None
    medicines: list | None = None
    instructions: list | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConsultationDetailResponse(ConsultationResponse):
    prescriptions: list[PrescriptionInline] = []


class TranscribeResponse(BaseModel):
    consultation_id: uuid.UUID
    transcript: str
    keyPoints: KeyPoints
    prescription: PrescriptionData
    summary: SummaryData
