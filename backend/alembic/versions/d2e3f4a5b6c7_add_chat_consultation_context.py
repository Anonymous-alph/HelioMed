"""add chat consultation context

Revision ID: d2e3f4a5b6c7
Revises: c1a2b3d4e5f6
Create Date: 2026-02-07 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1a2b3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "chat_messages",
        sa.Column("consultation_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_chat_messages_consultation_id",
        "chat_messages",
        "consultations",
        ["consultation_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_chat_messages_consultation_id",
        "chat_messages",
        ["consultation_id"],
    )

    op.add_column(
        "consultations",
        sa.Column("notes", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("consultations", "notes")

    op.drop_index("ix_chat_messages_consultation_id", table_name="chat_messages")
    op.drop_constraint("fk_chat_messages_consultation_id", "chat_messages", type_="foreignkey")
    op.drop_column("chat_messages", "consultation_id")
