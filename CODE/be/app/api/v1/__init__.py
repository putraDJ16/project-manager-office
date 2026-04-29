from flask import Blueprint


api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")


def register_api_routes():
    from app.api.v1 import (  # noqa: F401
        audit_trails,
        auth,
        employees,
        issues,
        notifications,
        organization_units,
        organizations,
        project_attachments,
        positions,
        projects,
        roles,
        sla,
        tasks,
    )

    return api_v1
