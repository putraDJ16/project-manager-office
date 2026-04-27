from flask import Blueprint


api_v1 = Blueprint("api_v1", __name__, url_prefix="/api/v1")


def register_api_routes():
    from app.api.v1 import auth, employees, issues, projects, roles, sla, tasks  # noqa: F401

    return api_v1
