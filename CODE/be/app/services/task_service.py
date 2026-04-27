from app.models.base import utcnow
from app.extensions import db
from app.models import Task
from app.repositories import ProjectRepository, TaskRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_tasks(project_id: str | None = None, search: str | None = None):
    return TaskRepository.list_tasks(project_id=project_id, search=search)


def create_task(payload: dict, created_by: str = "System"):
    required = ["title", "phase_id", "assignee", "project_id"]
    data = {field: (payload.get(field) or "").strip() for field in required}
    for field, value in data.items():
        if not value:
            raise ApiError("Semua field tugas wajib diisi.", errors={field: "required"})

    phase = ProjectRepository.get_phase(data["phase_id"])
    if not phase:
        raise ApiError("Fase tidak ditemukan.", errors={"phase_id": "not_found"})
    if phase.project_id != data["project_id"]:
        raise ApiError("Fase tidak termasuk ke project ini.", errors={"phase_id": "mismatch"})

    ids = [task.id for task in Task.query.with_entities(Task.id).all()]
    task = Task(
        id=next_string_id(ids, "T-", default_start=101),
        title=data["title"],
        priority=(payload.get("priority") or "Medium"),
        assignee=data["assignee"],
        project_id=data["project_id"],
        phase_id=data["phase_id"],
        created_by=created_by or "System",
    )
    db.session.add(task)
    db.session.commit()
    return task


def update_task(task_id: str, payload: dict):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)

    if "title" in payload:
        title = (payload.get("title") or "").strip()
        if not title:
            raise ApiError("Judul tugas wajib diisi.", errors={"title": "required"})
        task.title = title

    if "assignee" in payload:
        assignee = (payload.get("assignee") or "").strip()
        if not assignee:
            raise ApiError("Assignee wajib diisi.", errors={"assignee": "required"})
        task.assignee = assignee

    if "priority" in payload and payload["priority"]:
        task.priority = payload["priority"]

    if "phase_id" in payload and payload["phase_id"]:
        phase = ProjectRepository.get_phase(payload["phase_id"])
        if not phase:
            raise ApiError("Fase tidak ditemukan.", errors={"phase_id": "not_found"})
        if phase.project_id != task.project_id:
            raise ApiError("Fase tidak termasuk ke project tugas.", errors={"phase_id": "mismatch"})
        if task.phase_id != phase.id:
            task.phase_id = phase.id
            task.phase_updated_at = utcnow()

    db.session.commit()
    return task
