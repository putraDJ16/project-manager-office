from datetime import date

from app.extensions import db
from app.models import TaskTimesheet
from app.repositories import ProjectRepository, TaskRepository, TimesheetRepository
from app.services.task_service import is_assigned_to_task
from app.utils.exceptions import ApiError
from app.utils.permissions import user_is_project_member


def _parse_iso_date(value: str | None, field_name: str) -> date:
    if not value:
        raise ApiError("Tanggal kerja wajib diisi.", errors={field_name: "required"})
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ApiError("Format tanggal kerja tidak valid.", errors={field_name: "invalid"})


def _parse_hours(value) -> float:
    if value is None or value == "":
        raise ApiError("Jam kerja wajib diisi.", errors={"hours_spent": "required"})
    try:
        hours = float(value)
    except (TypeError, ValueError):
        raise ApiError("Jam kerja harus berupa angka.", errors={"hours_spent": "invalid"})
    if hours <= 0 or hours > 24:
        raise ApiError("Jam kerja harus di antara 0 sampai 24 jam.", errors={"hours_spent": "range"})
    return round(hours, 2)


def _ensure_task_access(task_id: str, user):
    task = TaskRepository.get_task(task_id)
    if not task:
        raise ApiError("Tugas tidak ditemukan.", status_code=404)
    if not is_assigned_to_task(task, user) and not user_is_project_member(user, task.project_id):
        raise ApiError("Anda tidak memiliki izin untuk mengisi timesheet tugas ini.", status_code=403)
    return task


def list_my_timesheets(user, start_date: str | None = None, end_date: str | None = None):
    start = _parse_iso_date(start_date, "start_date") if start_date else None
    end = _parse_iso_date(end_date, "end_date") if end_date else None
    if start and end and end < start:
        raise ApiError("Tanggal akhir tidak boleh lebih kecil dari tanggal awal.", errors={"end_date": "range"})
    return TimesheetRepository.list_by_user(user.id, start_date=start, end_date=end)


def list_project_timesheets(project_id: str, start_date: str | None = None, end_date: str | None = None):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    start = _parse_iso_date(start_date, "start_date") if start_date else None
    end = _parse_iso_date(end_date, "end_date") if end_date else None
    if start and end and end < start:
        raise ApiError("Tanggal akhir tidak boleh lebih kecil dari tanggal awal.", errors={"end_date": "range"})
    return TimesheetRepository.list_by_project(project_id, start_date=start, end_date=end)


def create_my_timesheet(payload: dict, user):
    project_id = (payload.get("project_id") or "").strip()
    if not project_id:
        raise ApiError("Project wajib dipilih.", errors={"project_id": "required"})
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    if not user_is_project_member(user, project_id):
        raise ApiError("Anda tidak memiliki izin untuk mengisi timesheet di project ini.", status_code=403)

    task_id = (payload.get("task_id") or "").strip() or None
    task = None
    if task_id:
        task = _ensure_task_access(task_id, user)
        if task.project_id != project_id:
            raise ApiError("Tugas tidak termasuk ke project yang dipilih.", errors={"task_id": "mismatch"})

    work_date = _parse_iso_date(payload.get("work_date"), "work_date")
    hours_spent = _parse_hours(payload.get("hours_spent"))
    notes = (payload.get("notes") or "").strip() or None
    if notes and len(notes) > 1000:
        raise ApiError("Catatan maksimal 1000 karakter.", errors={"notes": "max_length"})

    timesheet = TaskTimesheet(
        project_id=project_id,
        task_id=task.id if task else None,
        user_id=user.id,
        work_date=work_date,
        hours_spent=hours_spent,
        notes=notes,
    )
    db.session.add(timesheet)
    db.session.commit()
    return timesheet


def update_my_timesheet(timesheet_id: int, payload: dict, user):
    timesheet = TimesheetRepository.get_by_id(timesheet_id)
    if not timesheet or timesheet.user_id != user.id:
        raise ApiError("Timesheet tidak ditemukan.", status_code=404)

    if "project_id" in payload:
        project_id = (payload.get("project_id") or "").strip()
        if not project_id:
            raise ApiError("Project wajib dipilih.", errors={"project_id": "required"})
        project = ProjectRepository.get_project(project_id)
        if not project:
            raise ApiError("Project tidak ditemukan.", status_code=404)
        if not user_is_project_member(user, project_id):
            raise ApiError("Anda tidak memiliki izin untuk mengisi timesheet di project ini.", status_code=403)
        timesheet.project_id = project_id

    if "task_id" in payload:
        task_id = (payload.get("task_id") or "").strip() or None
        if task_id:
            task = _ensure_task_access(task_id, user)
            if task.project_id != timesheet.project_id:
                raise ApiError("Tugas tidak termasuk ke project yang dipilih.", errors={"task_id": "mismatch"})
            timesheet.task_id = task.id
        else:
            timesheet.task_id = None

    if "work_date" in payload:
        timesheet.work_date = _parse_iso_date(payload.get("work_date"), "work_date")

    if "hours_spent" in payload:
        timesheet.hours_spent = _parse_hours(payload.get("hours_spent"))

    if "notes" in payload:
        notes = (payload.get("notes") or "").strip() or None
        if notes and len(notes) > 1000:
            raise ApiError("Catatan maksimal 1000 karakter.", errors={"notes": "max_length"})
        timesheet.notes = notes

    db.session.commit()
    return timesheet


def delete_my_timesheet(timesheet_id: int, user):
    timesheet = TimesheetRepository.get_by_id(timesheet_id)
    if not timesheet or timesheet.user_id != user.id:
        raise ApiError("Timesheet tidak ditemukan.", status_code=404)
    db.session.delete(timesheet)
    db.session.commit()
