from datetime import date, timedelta

from app.models.base import utcnow
from app.extensions import db
from app.models import ProjectHoliday, Task, TaskChecklistItem, TaskComment
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


def _parse_mandays(value) -> int | None:
    if value is None or value == "":
        return None
    try:
        mandays = int(value)
    except (TypeError, ValueError):
        raise ApiError("Mandays harus berupa angka minimal 1.", errors={"mandays": "invalid"})
    if mandays < 1:
        raise ApiError("Mandays harus minimal 1 hari kerja.", errors={"mandays": "range"})
    return mandays


def _project_holiday_dates(project_id: str) -> set[date]:
    rows = ProjectHoliday.query.with_entities(ProjectHoliday.holiday_date).filter_by(project_id=project_id).all()
    return {row[0] for row in rows}


def _is_working_day(value: date, holidays: set[date]) -> bool:
    return value.weekday() < 5 and value not in holidays


def _calculate_end_date(start_date: date, mandays: int, project_id: str) -> date:
    holidays = _project_holiday_dates(project_id)
    cursor = start_date
    remaining = mandays
    while True:
        if _is_working_day(cursor, holidays):
            remaining -= 1
            if remaining == 0:
                return cursor
        cursor = cursor + timedelta(days=1)


def list_tasks(project_id: str | None = None, search: str | None = None):
    return TaskRepository.list_tasks(project_id=project_id, search=search)


def list_tasks_paginated(
    per_page: int,
    cursor_payload: dict | None,
    request,
    project_id: str | None = None,
    search: str | None = None,
    phase_id: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    status: str | None = None
) -> dict:
    """
    Get paginated list of tasks with filters.
    
    Args:
        per_page: Number of items per page
        cursor_payload: Decoded cursor dict or None
        request: Flask request object
        project_id: Filter by project
        search: Search term for task title
        phase_id: Filter by phase
        priority: Filter by priority
        assignee: Filter by assignee
        status: Filter by status
        
    Returns:
        Dict with items, meta, and links
    """
    from app.utils.pagination import paginate
    from app.schemas import tasks_schema
    
    # Get filtered query
    query = TaskRepository.query_tasks(
        project_id=project_id,
        search=search,
        phase_id=phase_id,
        priority=priority,
        assignee=assignee,
        status=status
    )
    
    # Sort spec: id ASC (primary key)
    sort_spec = [
        (Task.id, 'asc')
    ]
    
    # Paginate
    result = paginate(query, sort_spec, per_page, cursor_payload, request)
    
    # Serialize items
    result['items'] = tasks_schema.dump(result['items'])
    
    return result


def get_task(task_id: str):
    return TaskRepository.get_task(task_id)


def _normalize_assignee(value) -> str:
    return str(value or "").strip().lower()


def _abbreviated_name(name: str | None):
    parts = [part for part in (name or "").strip().split(" ") if part]
    if len(parts) < 2:
        return parts[0] if parts else None
    return f"{parts[0]} {parts[1][0]}."


def _assignment_aliases(user) -> set[str]:
    employee = user.employee if user.employee_id else None
    raw_aliases = [
        str(user.id),
        user.display_name,
        user.email,
        user.employee_id,
        employee.id if employee else None,
        employee.name if employee else None,
        employee.email if employee else None,
        _abbreviated_name(user.display_name),
        _abbreviated_name(employee.name if employee else None),
    ]
    return {_normalize_assignee(alias) for alias in raw_aliases if _normalize_assignee(alias)}


def is_assigned_progress_update(task: Task, payload: dict, user) -> bool:
    return (
        set(payload.keys()) == {"progress_percentage"}
        and _normalize_assignee(task.assignee) in _assignment_aliases(user)
    )


def is_assigned_to_task(task: Task, user) -> bool:
    return _normalize_assignee(task.assignee) in _assignment_aliases(user)


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
        mandays=_parse_mandays(payload.get("mandays")),
        start_date=_parse_date(payload.get("start_date")),
        end_date=_parse_date(payload.get("end_date")),
    )
    if task.start_date and task.mandays:
        task.end_date = _calculate_end_date(task.start_date, task.mandays, task.project_id)
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

    if "mandays" in payload:
        task.mandays = _parse_mandays(payload.get("mandays"))

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

    if any(key in payload for key in ("mandays", "start_date", "end_date")) and task.start_date and task.mandays:
        task.end_date = _calculate_end_date(task.start_date, task.mandays, task.project_id)

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


def list_task_checklist_items(task_id: str):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)
    return TaskRepository.list_task_checklist_items(task_id)


def create_task_checklist_item(task_id: str, payload: dict, created_by: str = "System"):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)

    title = (payload.get("title") or "").strip()
    if not title:
        raise ApiError("Judul checklist wajib diisi.", errors={"title": "required"})
    if len(title) > 240:
        raise ApiError("Judul checklist maksimal 240 karakter.", errors={"title": "max_length"})

    existing_items = TaskRepository.list_task_checklist_items(task_id)
    item = TaskChecklistItem(
        task_id=task.id,
        title=title,
        is_done=bool(payload.get("is_done", False)),
        order_index=len(existing_items) + 1,
        created_by=(created_by or "System").strip() or "System",
    )
    db.session.add(item)
    db.session.commit()
    return item


def update_task_checklist_item(task_id: str, item_id: int, payload: dict):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)

    item = TaskRepository.get_task_checklist_item(item_id)
    if not item or item.task_id != task_id:
        raise ApiError("Checklist tidak ditemukan.", status_code=404)

    if "title" in payload:
        title = (payload.get("title") or "").strip()
        if not title:
            raise ApiError("Judul checklist wajib diisi.", errors={"title": "required"})
        if len(title) > 240:
            raise ApiError("Judul checklist maksimal 240 karakter.", errors={"title": "max_length"})
        item.title = title

    if "is_done" in payload:
        item.is_done = bool(payload.get("is_done"))

    db.session.commit()
    return item


def delete_task_checklist_item(task_id: str, item_id: int):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)

    item = TaskRepository.get_task_checklist_item(item_id)
    if not item or item.task_id != task_id:
        raise ApiError("Checklist tidak ditemukan.", status_code=404)

    db.session.delete(item)
    db.session.commit()
