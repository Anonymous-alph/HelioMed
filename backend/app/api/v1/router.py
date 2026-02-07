from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.consultations import router as consultations_router
from app.api.v1.pharmacies import router as pharmacies_router
from app.api.v1.prescriptions import router as prescriptions_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(consultations_router)
api_v1_router.include_router(prescriptions_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(pharmacies_router)
