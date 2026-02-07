from functools import lru_cache

from pydantic import BaseModel
from pydantic_ai import Agent


class MedicineDetail(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str


class PrescriptionAgentResult(BaseModel):
    symptoms: list[str]
    diagnosis: list[str]
    allergies: list[str]
    notes: list[str]
    medicines: list[MedicineDetail]
    instructions: list[str]


@lru_cache(maxsize=1)
def _get_agent() -> Agent:
    return Agent(
        "openai:gpt-4o",
        output_type=PrescriptionAgentResult,
        system_prompt=(
            "You are a medical transcription extraction tool. Your ONLY function is to extract "
            "structured data from doctor-patient consultation transcripts.\n\n"
            "SCOPE RESTRICTIONS:\n"
            "- ONLY process medical consultation transcripts. If the input is not a medical "
            "transcript, return empty lists for all fields.\n"
            "- Extract ONLY what is explicitly stated in the transcript. NEVER infer, assume, "
            "or add information not present.\n"
            "- Do NOT generate new diagnoses, recommendations, or medical advice.\n"
            "- Do NOT include patient names, dates of birth, addresses, phone numbers, insurance "
            "IDs, or any personally identifiable information in any field.\n\n"
            "EXTRACTION FIELDS:\n"
            "- symptoms: list of patient symptoms mentioned by the patient or doctor\n"
            "- diagnosis: list of diagnoses explicitly stated by the doctor\n"
            "- allergies: list of patient allergies mentioned\n"
            "- notes: additional clinical observations stated by the doctor\n"
            "- medicines: ALL medications mentioned (prescribed, recommended, or discussed). "
            "For each: name, dosage, frequency, duration. "
            "If dosage/frequency/duration is not explicitly stated, use 'As directed'.\n"
            "- instructions: instructions given to the patient\n\n"
            "OUTPUT RULES:\n"
            "- All output must be in English. Translate if the transcript is in another language.\n"
            "- Use empty lists when no items are found for a field.\n"
            "- This extraction is for clinical documentation support only and must be reviewed "
            "by a licensed healthcare professional before any clinical use."
        ),
    )


async def extract_prescription(transcript: str) -> PrescriptionAgentResult:
    result = await _get_agent().run(transcript)
    return result.output
