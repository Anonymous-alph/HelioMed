import io

from openai import AsyncOpenAI

from app.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    ext_map = {
        "audio/webm": "webm",
        "audio/wav": "wav",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
        "audio/mp4": "mp4",
    }
    ext = ext_map.get(mime_type, "webm")

    client = _get_client()
    # Use translations endpoint to always output English
    transcript = await client.audio.translations.create(
        model="whisper-1",
        file=(f"audio.{ext}", io.BytesIO(audio_bytes), mime_type),
    )
    return transcript.text
