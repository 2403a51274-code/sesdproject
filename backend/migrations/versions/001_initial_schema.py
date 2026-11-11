"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-04 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # URLs table
    op.create_table(
        'urls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('original_url', sa.Text(), nullable=False),
        sa.Column('short_code', sa.String(length=64), nullable=False),
        sa.Column('click_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('redirect_type', sa.Integer(), nullable=False, server_default='302'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_urls_id'), 'urls', ['id'], unique=False)
    op.create_index(op.f('ix_urls_short_code'), 'urls', ['short_code'], unique=True)
    op.create_index(op.f('ix_urls_user_id'), 'urls', ['user_id'], unique=False)

    # Daily click stats table
    op.create_table(
        'daily_click_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('url_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('click_count', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['url_id'], ['urls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('url_id', 'date', name='uq_url_date')
    )
    op.create_index(op.f('ix_daily_click_stats_id'), 'daily_click_stats', ['id'], unique=False)
    op.create_index(op.f('ix_daily_click_stats_url_id'), 'daily_click_stats', ['url_id'], unique=False)
    op.create_index(op.f('ix_daily_click_stats_date'), 'daily_click_stats', ['date'], unique=False)

    # Click events table
    op.create_table(
        'click_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('url_id', sa.Integer(), nullable=False),
        sa.Column('clicked_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ip_hash', sa.String(length=64), nullable=True),
        sa.Column('referer', sa.String(length=256), nullable=True),
        sa.Column('user_agent_summary', sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(['url_id'], ['urls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_click_events_id'), 'click_events', ['id'], unique=False)
    op.create_index(op.f('ix_click_events_url_id'), 'click_events', ['url_id'], unique=False)
    op.create_index(op.f('ix_click_events_clicked_at'), 'click_events', ['clicked_at'], unique=False)

    # Email verification tokens table
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_verification_tokens_id'), 'email_verification_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_email_verification_tokens_token'), 'email_verification_tokens', ['token'], unique=True)
    op.create_index(op.f('ix_email_verification_tokens_user_id'), 'email_verification_tokens', ['user_id'], unique=False)

    # Password reset tokens table
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_tokens_id'), 'password_reset_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_password_reset_tokens_token'), 'password_reset_tokens', ['token'], unique=True)
    op.create_index(op.f('ix_password_reset_tokens_user_id'), 'password_reset_tokens', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('password_reset_tokens')
    op.drop_table('email_verification_tokens')
    op.drop_table('click_events')
    op.drop_table('daily_click_stats')
    op.drop_table('urls')
    op.drop_table('users')
