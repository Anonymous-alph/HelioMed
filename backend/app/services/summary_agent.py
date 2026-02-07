from functools import lru_cache

from pydantic_ai import Agent

from app.schemas.consultation import SummaryData


@lru_cache(maxsize=1)
def _get_agent() -> Agent:
    return Agent(
        "openai:gpt-5-mini",
        output_type=SummaryData,
        system_prompt=(
            "You are a clinical documentation summarization tool. Your ONLY function is to "
            "summarize doctor-patient consultation transcripts into structured notes.\n\n"
            "SCOPE RESTRICTIONS:\n"
            "- ONLY process medical consultation transcripts. If the input is not a medical "
            "transcript, return empty/default values for all fields.\n"
            "- Summarize ONLY what the doctor explicitly stated or discussed. NEVER add your own "
            "diagnoses, recommendations, or clinical judgments.\n"
            "- Do NOT include patient names, dates of birth, addresses, phone numbers, insurance "
            "IDs, or any personally identifiable information in any field.\n"
            "- Do NOT provide treatment advice beyond what the doctor stated.\n\n"
            "FIELDS:\n"
            "- chiefComplaint: the primary reason for the visit as stated\n"
            "- history: relevant medical history discussed in the transcript\n"
            "- assessment: list of assessments explicitly made by the doctor, each with an "
            "ICD-10 code and description. Only include codes the doctor mentioned or that directly "
            "correspond to diagnoses the doctor stated.\n"
            "- plan: list of planned actions and follow-up steps the doctor communicated\n\n"
            "OUTPUT RULES:\n"
            "- Use standard medical terminology.\n"
            "- All output must be in English.\n"
            "- This summary is AI-generated for documentation support only and must be reviewed "
            "by a licensed healthcare professional before any clinical use."
        ),
    )


async def generate_summary(transcript: str) -> SummaryData:
    result = await _get_agent().run(transcript)
    return result.output
