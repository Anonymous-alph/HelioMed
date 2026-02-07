"""fix users created_at to timestamptz

Revision ID: c1a2b3d4e5f6
Revises: b697f3177e05
Create Date: 2026-02-07 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = 'b697f3177e05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'users',
        'created_at',
        type_=sa.DateTime(timezone=True),
        server_default=sa.text('now()'),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        'users',
        'created_at',
        type_=sa.DateTime(),
        server_default=None,
        existing_nullable=False,
    )
