from flask import request
from flask_jwt_extended import jwt_required

from app.api.v1 import api_v1
from app.schemas import issue_schema, issues_schema
from app.services import issue_service
from app.utils.http import success_response


@api_v1.get("/issues")
@jwt_required()
def list_issues_handler():
    project_id = (request.args.get("project_id") or "").strip() or None
    issues = issue_service.list_issues(project_id=project_id)
    return success_response(issues_schema.dump(issues))


@api_v1.post("/issues")
@jwt_required()
def create_issue_handler():
    payload = request.get_json(silent=True) or {}
    issue = issue_service.create_issue(payload)
    return success_response(issue_schema.dump(issue), message="Isu berhasil dibuat.", status_code=201)


@api_v1.patch("/issues/<string:issue_id>/status")
@jwt_required()
def update_issue_status_handler(issue_id: str):
    payload = request.get_json(silent=True) or {}
    issue = issue_service.update_issue_status(issue_id, payload.get("status", ""))
    return success_response(issue_schema.dump(issue), message="Status isu berhasil diperbarui.")


@api_v1.post("/issues/<string:issue_id>/escalate")
@jwt_required()
def escalate_issue_handler(issue_id: str):
    issue = issue_service.escalate_issue(issue_id)
    return success_response(issue_schema.dump(issue), message="Isu berhasil dieskalasi.")
