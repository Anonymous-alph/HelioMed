"""add title summary keypoints to consultations

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-02-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "consultations",
        sa.Column("title", sa.String(255), nullable=True),
    )
    op.add_column(
        "consultations",
        sa.Column("summary", postgresql.JSONB(), nullable=True),
    )
    op.add_column(
        "consultations",
        sa.Column("key_points", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("consultations", "key_points")
    op.drop_column("consultations", "summary")
    op.drop_column("consultations", "title")
