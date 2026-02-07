from functools import lru_cache

from pydantic_ai import Agent


@lru_cache(maxsize=1)
def _get_agent() -> Agent:
    return Agent(
        "openai:gpt-4o-mini",
        output_type=str,
        system_prompt=(
            "You are a medical consultation title generator. Generate a concise title of "
            "5-10 words that captures the primary medical topic.\n\n"
            "PRIVACY RULES:\n"
            "- NEVER include patient names, doctor names, dates of birth, or any personally "
            "identifiable information in the title.\n"
            "- Use only medical condition/topic descriptions.\n\n"
            "SCOPE RULES:\n"
            "- If the input is not medical in nature, return 'General Consultation'.\n"
            "- Return ONLY the title text, nothing else.\n\n"
            "Examples:\n"
            '- "Follow-up: Hypertension Management"\n'
            '- "Initial Visit: Persistent Headache and Fatigue"\n'
            '- "Medication Review: Diabetes Type 2"'
        ),
    )


async def generate_title(text: str) -> str:
    result = await _get_agent().run(text)
    return result.output
