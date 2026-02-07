from __future__ import annotations

from functools import lru_cache

from pydantic_ai import Agent, BinaryContent, ImageUrl

from app.schemas.consultation import SummaryData
from app.services.prescription_agent import PrescriptionAgentResult

# ---------------------------------------------------------------------------
# MIME helpers
# ---------------------------------------------------------------------------

MIME_MAP: dict[str, str] = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
}

ACCEPTED_IMAGE_TYPES = {
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "image/bmp", "image/tiff",
}

# ---------------------------------------------------------------------------
# Prescription image agent — extracts same fields as text-based agent
# ---------------------------------------------------------------------------

_PRESCRIPTION_IMAGE_SYSTEM = (
    "You are a medical document data extraction tool. Your ONLY function is to extract "
    "structured prescription data from images of medical prescriptions, medication labels, "
    "or clinical documents.\n\n"
    "SCOPE RESTRICTIONS:\n"
    "- If the image is NOT a medical document (e.g. a selfie, landscape, screenshot of "
    "non-medical content), return empty lists for ALL fields. Do not attempt extraction.\n"
    "- Extract ONLY information visible in the image. NEVER infer, fabricate, or add "
    "information not present.\n"
    "- Do NOT generate your own diagnoses or medical recommendations.\n\n"
    "PRIVACY:\n"
    "- Do NOT include patient names, dates of birth, addresses, phone numbers, insurance "
    "IDs, or any personally identifiable information in any output field.\n"
    "- If PII is visible on the document, omit it from extraction.\n\n"
    "EXTRACTION FIELDS:\n"
    "- medicines: name, dosage, frequency, duration for each. Use 'Not specified' if illegible.\n"
    "- symptoms, allergies: include only if written on the document.\n"
    "- diagnosis: include only if explicitly stated on the document.\n"
    "- instructions: all patient instructions visible.\n\n"
    "OUTPUT RULES:\n"
    "- All output in English. Translate if the document is in another language.\n"
    "- Use empty lists when no items are visible.\n"
    "- This extraction is AI-generated and must be reviewed by a healthcare professional "
    "before any clinical use."
)


@lru_cache(maxsize=1)
def _get_prescription_image_agent() -> Agent:
    return Agent(
        "openai:gpt-5-mini",
        output_type=PrescriptionAgentResult,
        system_prompt=_PRESCRIPTION_IMAGE_SYSTEM,
    )


# ---------------------------------------------------------------------------
# Summary image agent — generates clinical summary from prescription image
# ---------------------------------------------------------------------------

_SUMMARY_IMAGE_SYSTEM = (
    "You are a medical document summarization tool. Your ONLY function is to summarize "
    "information visible in images of medical prescriptions or clinical documents.\n\n"
    "SCOPE RESTRICTIONS:\n"
    "- If the image is NOT a medical document, return empty/default values for all fields.\n"
    "- Summarize ONLY what is explicitly written on the document. NEVER add your own "
    "diagnoses, clinical judgments, or treatment recommendations.\n"
    "- Do NOT infer conditions from medications. If no chief complaint is written, use "
    "'Not stated on document'.\n\n"
    "PRIVACY:\n"
    "- Do NOT include patient names, dates of birth, addresses, phone numbers, insurance "
    "IDs, or any personally identifiable information in any output field.\n\n"
    "FIELDS:\n"
    "- chiefComplaint: the condition stated on the document, or 'Not stated on document'.\n"
    "- history: medical history noted on the document, or 'Not available from document'.\n"
    "- assessment: conditions and ICD-10 codes ONLY if explicitly written on the document.\n"
    "- plan: treatment plan ONLY as written on the document.\n\n"
    "OUTPUT RULES:\n"
    "- All output in English.\n"
    "- This summary is AI-generated and must be reviewed by a healthcare professional "
    "before any clinical use."
)


@lru_cache(maxsize=1)
def _get_summary_image_agent() -> Agent:
    return Agent(
        "openai:gpt-5-mini",
        output_type=SummaryData,
        system_prompt=_SUMMARY_IMAGE_SYSTEM,
    )


# ---------------------------------------------------------------------------
# Title image agent — generates a short consultation title from the image
# ---------------------------------------------------------------------------

_TITLE_IMAGE_SYSTEM = (
    "Generate a concise 5-10 word title for a medical document image.\n\n"
    "PRIVACY: NEVER include patient names, doctor names, dates of birth, or any "
    "personally identifiable information in the title. Use only medical topic descriptions.\n\n"
    "SCOPE: If the image is not a medical document, return 'Document Scan'.\n"
    "Return ONLY the title text, nothing else.\n\n"
    "Examples: 'Prescription: Hypertension Medication Refill', "
    "'Lab Report: Complete Blood Count Results'."
)


@lru_cache(maxsize=1)
def _get_title_image_agent() -> Agent:
    return Agent(
        "openai:gpt-5-mini",
        output_type=str,
        system_prompt=_TITLE_IMAGE_SYSTEM,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _make_image_content(data: bytes, media_type: str) -> BinaryContent:
    return BinaryContent(data=data, media_type=media_type)


async def extract_prescription_from_image(
    data: bytes,
    media_type: str = "image/png",
) -> PrescriptionAgentResult:
    """Extract prescription data from an image."""
    agent = _get_prescription_image_agent()
    img = _make_image_content(data, media_type)
    result = await agent.run(["Extract prescription data from this image:", img])
    return result.output


async def generate_summary_from_image(
    data: bytes,
    media_type: str = "image/png",
) -> SummaryData:
    """Generate clinical summary from a prescription/document image."""
    agent = _get_summary_image_agent()
    img = _make_image_content(data, media_type)
    result = await agent.run(["Generate a clinical summary from this image:", img])
    return result.output


async def generate_title_from_image(
    data: bytes,
    media_type: str = "image/png",
) -> str:
    """Generate a short title from a prescription/document image."""
    agent = _get_title_image_agent()
    img = _make_image_content(data, media_type)
    result = await agent.run(["Generate a title for this medical document:", img])
    return result.output
