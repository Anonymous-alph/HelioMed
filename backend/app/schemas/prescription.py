import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.consultation import MedicineItem


class PrescriptionResponse(BaseModel):
    id: uuid.UUID
    consultation_id: uuid.UUID
    diagnosis: str | None
    medicines: list[MedicineItem] | None
    instructions: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PrescriptionUpdate(BaseModel):
    diagnosis: str | None = None
    medicines: list[MedicineItem] | None = None
    instructions: list[str] | None = None
