from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import task_schema, tasks_schema
from app.schemas import task_checklist_item_schema, task_checklist_items_schema
from app.schemas import task_comment_schema, task_comments_schema
from app.services import task_service
from app.utils.exceptions import ApiError
from app.utils.http import success_response
from app.utils.permissions import get_current_user, user_has_permission, user_is_project_member


def _ensure_task_interaction_access(task_id: str, action: str):
    current_user = get_current_user()
    task = task_service.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)
    if (
        not user_has_permission(current_user, "projectTaskComments", action)
        and not user_is_project_member(current_user, task.project_id)
        and not task_service.is_assigned_to_task(task, current_user)
    ):
        raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)


def _ensure_project_task_access(project_id: str | None, action: str):
    current_user = get_current_user()
    if action == "view" and not project_id and user_has_permission(current_user, "tasks", "view"):
        return
    if action == "view" and user_has_permission(current_user, "projectGantt", "view"):
        return
    if user_has_permission(current_user, "projectTasks", action) or user_is_project_member(current_user, project_id):
        return
    raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)


@api_v1.get("/tasks")
@jwt_required()
def list_tasks_handler():
    project_id = request.args.get("project_id")
    _ensure_project_task_access(project_id, "view")
    search = request.args.get("search")
    tasks = task_service.list_tasks(project_id=project_id, search=search)
    return success_response(tasks_schema.dump(tasks))


@api_v1.post("/tasks")
@jwt_required()
def create_task_handler():
    payload = request.get_json(silent=True) or {}
    _ensure_project_task_access(payload.get("project_id"), "create")
    claims = get_jwt()
    task = task_service.create_task(payload, created_by=claims.get("name", "System"))
    return success_response(task_schema.dump(task), message="Tugas berhasil ditambahkan.", status_code=201)


@api_v1.patch("/tasks/<string:task_id>")
@jwt_required()
def update_task_handler(task_id: str):
    payload = request.get_json(silent=True) or {}
    current_user = get_current_user()
    if not user_has_permission(current_user, "projectTasks", "edit"):
        task = task_service.get_task(task_id)
        if not task:
            raise ApiError("Tugas tidak ditemukan.", status_code=404)
        if not user_is_project_member(current_user, task.project_id) and not task_service.is_assigned_progress_update(
            task, payload, current_user
        ):
            raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)

    task = task_service.update_task(task_id, payload)
    return success_response(task_schema.dump(task), message="Tugas berhasil diperbarui.")


@api_v1.get("/tasks/<string:task_id>/comments")
@jwt_required()
def list_task_comments_handler(task_id: str):
    _ensure_task_interaction_access(task_id, "view")
    comments = task_service.list_task_comments(task_id)
    return success_response(task_comments_schema.dump(comments))


@api_v1.post("/tasks/<string:task_id>/comments")
@jwt_required()
def create_task_comment_handler(task_id: str):
    _ensure_task_interaction_access(task_id, "create")
    payload = request.get_json(silent=True) or {}
    claims = get_jwt()
    comment = task_service.create_task_comment(task_id, payload, author_name=claims.get("name", "System"))
    return success_response(
        task_comment_schema.dump(comment),
        message="Komentar berhasil ditambahkan.",
        status_code=201,
    )


@api_v1.get("/tasks/<string:task_id>/checklist")
@jwt_required()
def list_task_checklist_handler(task_id: str):
    _ensure_task_interaction_access(task_id, "view")
    items = task_service.list_task_checklist_items(task_id)
    return success_response(task_checklist_items_schema.dump(items))


@api_v1.post("/tasks/<string:task_id>/checklist")
@jwt_required()
def create_task_checklist_handler(task_id: str):
    _ensure_task_interaction_access(task_id, "create")
    payload = request.get_json(silent=True) or {}
    claims = get_jwt()
    item = task_service.create_task_checklist_item(task_id, payload, created_by=claims.get("name", "System"))
    return success_response(
        task_checklist_item_schema.dump(item),
        message="Checklist berhasil ditambahkan.",
        status_code=201,
    )


@api_v1.patch("/tasks/<string:task_id>/checklist/<int:item_id>")
@jwt_required()
def update_task_checklist_handler(task_id: str, item_id: int):
    _ensure_task_interaction_access(task_id, "create")
    payload = request.get_json(silent=True) or {}
    item = task_service.update_task_checklist_item(task_id, item_id, payload)
    return success_response(task_checklist_item_schema.dump(item), message="Checklist berhasil diperbarui.")


@api_v1.delete("/tasks/<string:task_id>/checklist/<int:item_id>")
@jwt_required()
def delete_task_checklist_handler(task_id: str, item_id: int):
    _ensure_task_interaction_access(task_id, "create")
    task_service.delete_task_checklist_item(task_id, item_id)
    return success_response(None, message="Checklist berhasil dihapus.")
