from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import task_schema, tasks_schema
from app.schemas import task_comment_schema, task_comments_schema
from app.services import task_service
from app.utils.exceptions import ApiError
from app.utils.http import success_response
from app.utils.permissions import get_current_user, require_permission, user_has_permission


@api_v1.get("/tasks")
@jwt_required()
@require_permission("projectTasks", "view")
def list_tasks_handler():
    project_id = request.args.get("project_id")
    search = request.args.get("search")
    tasks = task_service.list_tasks(project_id=project_id, search=search)
    return success_response(tasks_schema.dump(tasks))


@api_v1.post("/tasks")
@jwt_required()
@require_permission("projectTasks", "create")
def create_task_handler():
    payload = request.get_json(silent=True) or {}
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
        if not task_service.is_assigned_progress_update(task, payload, current_user):
            raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)

    task = task_service.update_task(task_id, payload)
    return success_response(task_schema.dump(task), message="Tugas berhasil diperbarui.")


@api_v1.get("/tasks/<string:task_id>/comments")
@jwt_required()
@require_permission("projectTaskComments", "view")
def list_task_comments_handler(task_id: str):
    comments = task_service.list_task_comments(task_id)
    return success_response(task_comments_schema.dump(comments))


@api_v1.post("/tasks/<string:task_id>/comments")
@jwt_required()
@require_permission("projectTaskComments", "create")
def create_task_comment_handler(task_id: str):
    payload = request.get_json(silent=True) or {}
    claims = get_jwt()
    comment = task_service.create_task_comment(task_id, payload, author_name=claims.get("name", "System"))
    return success_response(
        task_comment_schema.dump(comment),
        message="Komentar berhasil ditambahkan.",
        status_code=201,
    )
