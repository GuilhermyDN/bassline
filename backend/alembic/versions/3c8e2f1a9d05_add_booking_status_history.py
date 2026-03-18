"""add_booking_status_history

Revision ID: 3c8e2f1a9d05
Revises: 1bd9a97bb41c
Create Date: 2026-03-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c8e2f1a9d05'
down_revision: Union[str, None] = '1bd9a97bb41c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'booking_status_history',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('booking_id', sa.String(), nullable=False),
        sa.Column('from_status', sa.String(), nullable=True),
        sa.Column('to_status', sa.String(), nullable=False),
        sa.Column('changed_by_user_id', sa.String(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_booking_status_history_booking_id'),
        'booking_status_history',
        ['booking_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_booking_status_history_changed_by_user_id'),
        'booking_status_history',
        ['changed_by_user_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f('ix_booking_status_history_changed_by_user_id'),
        table_name='booking_status_history',
    )
    op.drop_index(
        op.f('ix_booking_status_history_booking_id'),
        table_name='booking_status_history',
    )
    op.drop_table('booking_status_history')
