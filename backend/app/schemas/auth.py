import uuid

from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None = None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserOut
    message: str
