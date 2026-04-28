"""add master reference tables

Revision ID: c4e5f6a7b8c9
Revises: b3c4d5e6f7a8
Create Date: 2026-04-28 18:20:00.000000

"""

from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4e5f6a7b8c9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def _load_distinct_names(conn, source_column: str):
    rows = conn.execute(
        sa.text(
            f"""
            SELECT DISTINCT {source_column}
            FROM employees
            WHERE {source_column} IS NOT NULL
              AND TRIM({source_column}) <> ''
            ORDER BY {source_column}
            """
        )
    ).fetchall()

    seen = set()
    results = []
    for row in rows:
        value = (row[0] or "").strip()
        if not value:
            continue
        normalized = value.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        results.append(value)
    return results


def _insert_reference_rows(conn, table_name: str, prefix: str, names: list[str]):
    now = datetime.now(timezone.utc)
    for index, name in enumerate(names, start=1):
        conn.execute(
            sa.text(
                f"""
                INSERT INTO {table_name} (id, name, status, created_at, updated_at)
                VALUES (:id, :name, :status, :created_at, :updated_at)
                """
            ),
            {
                "id": f"{prefix}{str(index).zfill(3)}",
                "name": name,
                "status": "Active",
                "created_at": now,
                "updated_at": now,
            },
        )


def upgrade():
    master_status_enum = sa.Enum("Active", "Inactive", name="master_reference_status")

    op.create_table(
        "organizations",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("status", master_status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "organization_units",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column(
            "status",
            sa.Enum("Active", "Inactive", name="master_reference_status", create_type=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "positions",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column(
            "status",
            sa.Enum("Active", "Inactive", name="master_reference_status", create_type=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    conn = op.get_bind()
    organizations = _load_distinct_names(conn, "organization")
    units = _load_distinct_names(conn, "unit_organization")
    positions = _load_distinct_names(conn, "position")

    if not organizations:
        organizations = ["ZOHO PM SaaS"]
    if not units:
        units = ["Engineering", "Quality Assurance", "Product Design"]
    if not positions:
        positions = ["Lead Developer", "QA Engineer", "UI/UX Designer", "Backend Developer"]

    _insert_reference_rows(conn, "organizations", "org-", organizations)
    _insert_reference_rows(conn, "organization_units", "unit-", units)
    _insert_reference_rows(conn, "positions", "pos-", positions)


def downgrade():
    op.drop_table("positions")
    op.drop_table("organization_units")
    op.drop_table("organizations")

    master_status_enum = sa.Enum("Active", "Inactive", name="master_reference_status")
    master_status_enum.drop(op.get_bind(), checkfirst=True)
