from flask import request
from flask_jwt_extended import get_jwt, jwt_required

from app.api.v1 import api_v1
from app.schemas import task_schema, tasks_schema
from app.services import task_service
from app.utils.http import success_response


@api_v1.get("/tasks")
@jwt_required()
def list_tasks_handler():
    project_id = request.args.get("project_id")
    search = request.args.get("search")
    tasks = task_service.list_tasks(project_id=project_id, search=search)
    return success_response(tasks_schema.dump(tasks))


@api_v1.post("/tasks")
@jwt_required()
def create_task_handler():
    payload = request.get_json(silent=True) or {}
    claims = get_jwt()
    task = task_service.create_task(payload, created_by=claims.get("name", "System"))
    return success_response(task_schema.dump(task), message="Tugas berhasil ditambahkan.", status_code=201)


@api_v1.patch("/tasks/<string:task_id>")
@jwt_required()
def update_task_handler(task_id: str):
    payload = request.get_json(silent=True) or {}
    task = task_service.update_task(task_id, payload)
    return success_response(task_schema.dump(task), message="Tugas berhasil diperbarui.")
