import logging

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.database.session import engine

logger = logging.getLogger(__name__)

app = FastAPI(title="Helio Med API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)


@app.on_event("startup")
async def startup_checks():
    if not settings.OPENAI_API_KEY.strip():
        logger.warning("OPENAI_API_KEY is empty; OpenAI-backed features will fail until the environment secret is set.")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable ({exc.__class__.__name__})") from exc
    return {"status": "ok", "database": "ok"}
