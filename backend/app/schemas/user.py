import uuid
from datetime import datetime

from pydantic import BaseModel


class CurrentUser(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None = None


class UserProfileCreate(BaseModel):
    role: str = "patient"
    full_name: str = ""


class UserProfileUpdate(BaseModel):
    role: str | None = None
    full_name: str | None = None


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    full_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
