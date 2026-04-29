from datetime import date

from app.models.base import utcnow
from app.extensions import db
from app.models import Task, TaskComment
from app.repositories import ProjectRepository, TaskRepository
from app.services.notification_service import notify_employee
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _parse_progress(value) -> int:
    if value is None or value == "":
        return 0
    try:
        progress = int(value)
    except (TypeError, ValueError):
        raise ApiError("Persentase progress harus berupa angka 0-100.", errors={"progress_percentage": "invalid"})

    if progress < 0 or progress > 100:
        raise ApiError("Persentase progress harus di antara 0 sampai 100.", errors={"progress_percentage": "range"})
    return progress


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
        progress_percentage=_parse_progress(payload.get("progress_percentage")),
        start_date=_parse_date(payload.get("start_date")),
        end_date=_parse_date(payload.get("end_date")),
    )
    db.session.add(task)
    notify_employee(
        employee_id=data["assignee"],
        employee_name=data["assignee"],
        title="Tugas baru ditugaskan kepada Anda",
        message=f"Anda mendapat tugas {task.title}.",
        entity_type="task",
        entity_id=task.id,
        target_url=f"/proyek/{task.project_id}",
    )
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

    if "progress_percentage" in payload:
        task.progress_percentage = _parse_progress(payload.get("progress_percentage"))

    if "start_date" in payload:
        task.start_date = _parse_date(payload.get("start_date"))

    if "end_date" in payload:
        task.end_date = _parse_date(payload.get("end_date"))

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


def list_task_comments(task_id: str):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)
    return TaskRepository.list_task_comments(task_id)


def create_task_comment(task_id: str, payload: dict, author_name: str = "System"):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)

    content = (payload.get("content") or "").strip()
    if not content:
        raise ApiError("Komentar wajib diisi.", errors={"content": "required"})
    if len(content) > 2000:
        raise ApiError("Komentar maksimal 2000 karakter.", errors={"content": "max_length"})

    comment = TaskComment(
        task_id=task.id,
        author_name=(author_name or "System").strip() or "System",
        content=content,
    )
    db.session.add(comment)
    db.session.commit()
    return comment
