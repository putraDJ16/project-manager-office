from flask import g, request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import issue_schema, issues_schema
from app.services import issue_service
from app.utils.exceptions import ApiError
from app.utils.http import success_response
from app.utils.permissions import get_current_user, user_has_permission, user_is_project_member


def _ensure_project_issue_access(project_id: str | None, action: str):
    current_user = get_current_user()
    if user_has_permission(current_user, "projectIssues", action):
        return
    if action == "view" and user_is_project_member(current_user, project_id):
        return
    raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)


def _ensure_issue_access(issue_id: str, action: str):
    issue = issue_service.get_issue(issue_id)
    if not issue:
        raise ApiError("Isu tidak ditemukan.", status_code=404)
    _ensure_project_issue_access(issue.project_id, action)


@api_v1.get("/issues")
@jwt_required()
def list_issues_handler():
    project_id = (request.args.get("project_id") or "").strip() or None
    _ensure_project_issue_access(project_id, "view")
    issues = issue_service.list_issues(project_id=project_id)
    return success_response(issues_schema.dump(issues))


@api_v1.post("/issues")
@jwt_required()
def create_issue_handler():
    payload = request.get_json(silent=True) or {}
    _ensure_project_issue_access((payload.get("project_id") or "").strip(), "create")
    claims = get_jwt()
    issue = issue_service.create_issue(payload, reporter_from_claim=claims.get("name"))
    return success_response(issue_schema.dump(issue), message="Isu berhasil dibuat.", status_code=201)


@api_v1.patch("/issues/<string:issue_id>/status")
@jwt_required()
def update_issue_status_handler(issue_id: str):
    current_user = get_current_user()
    payload = request.get_json(silent=True) or {}
    existing_issue = issue_service.get_issue(issue_id)
    previous_status = existing_issue.status if existing_issue else None
    issue = issue_service.update_issue_status(issue_id, payload.get("status", ""), actor=current_user)
    if previous_status and previous_status != issue.status:
        g.audit_note = (
            f"Issue {issue.id} status changed from '{previous_status}' to '{issue.status}' by "
            f"{current_user.display_name}"
        )
    return success_response(issue_schema.dump(issue), message="Status isu berhasil diperbarui.")


@api_v1.post("/issues/<string:issue_id>/escalate")
@jwt_required()
def escalate_issue_handler(issue_id: str):
    _ensure_issue_access(issue_id, "edit")
    issue = issue_service.escalate_issue(issue_id)
    return success_response(issue_schema.dump(issue), message="Isu berhasil dieskalasi.")
