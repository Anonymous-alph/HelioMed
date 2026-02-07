from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.user import User  # noqa: E402, F401
from app.models.user_profile import UserProfile  # noqa: E402, F401
from app.models.consultation import Consultation  # noqa: E402, F401
from app.models.prescription import Prescription  # noqa: E402, F401
from app.models.chat_message import ChatMessage  # noqa: E402, F401
