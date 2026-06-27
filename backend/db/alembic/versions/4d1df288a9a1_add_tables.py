"""add tables

Revision ID: 4d1df288a9a1
Revises: cfb8c3a2799c
Create Date: 2026-06-27 16:09:48.062434

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d1df288a9a1'
down_revision: Union[str, Sequence[str], None] = 'cfb8c3a2799c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'users',
        'avatar',
        existing_type=sa.String(length=100),
        type_=sa.String(length=500),
        new_column_name='image_url',
        existing_nullable=False,
    )

    op.create_table('roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    op.add_column(
        'projects',
        sa.Column('practical_benefit', sa.String(length=500), server_default='', nullable=False),
    )
    op.add_column(
        'projects',
        sa.Column('implementation_details', sa.String(length=500), server_default='', nullable=False),
    )
    op.add_column(
        'projects',
        sa.Column('results', sa.String(length=500), server_default='', nullable=False),
    )
    op.alter_column('projects', 'practical_benefit', server_default=None)
    op.alter_column('projects', 'implementation_details', server_default=None)
    op.alter_column('projects', 'results', server_default=None)

    op.execute("""
        INSERT INTO roles (name)
        SELECT DISTINCT role
        FROM member_roles
        WHERE role IS NOT NULL
    """)
    op.add_column('member_roles', sa.Column('role_id', sa.Integer(), nullable=True))
    op.execute("""
        UPDATE member_roles
        SET role_id = roles.id
        FROM roles
        WHERE roles.name = member_roles.role
    """)
    op.alter_column('member_roles', 'role_id', existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key(
        'fk_member_roles_role_id_roles',
        'member_roles',
        'roles',
        ['role_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.drop_column('member_roles', 'role')

    op.create_table('project_invites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('inviter_id', sa.Integer(), nullable=False),
        sa.Column('invitee_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', name='invitestatus'),
            nullable=False,
        ),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['invitee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('project_invites')

    op.add_column('member_roles', sa.Column('role', sa.String(length=100), nullable=True))
    op.execute("""
        UPDATE member_roles
        SET role = roles.name
        FROM roles
        WHERE roles.id = member_roles.role_id
    """)
    op.alter_column('member_roles', 'role', existing_type=sa.String(length=100), nullable=False)
    op.drop_constraint('fk_member_roles_role_id_roles', 'member_roles', type_='foreignkey')
    op.drop_column('member_roles', 'role_id')
    op.drop_table('roles')

    op.drop_column('projects', 'results')
    op.drop_column('projects', 'implementation_details')
    op.drop_column('projects', 'practical_benefit')

    op.alter_column(
        'users',
        'image_url',
        existing_type=sa.String(length=500),
        type_=sa.String(length=100),
        new_column_name='avatar',
        existing_nullable=False,
    )
