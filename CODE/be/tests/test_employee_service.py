import pytest

from app.services.employee_service import create_employee
from app.utils.exceptions import ApiError


def test_employee_duplicate_email_blocked(app):
    with app.app_context():
        with pytest.raises(ApiError):
            create_employee(
                {
                    "nip": "20000101-888",
                    "name": "Dup",
                    "email": "andi.jatmiko@company.co.id",
                    "organization": "ZOHO PM SaaS",
                    "unit_organization": "Engineering",
                    "position": "Lead Developer",
                    "role_id": "role-001",
                }
            )
