from app.extensions import db
from datetime import date, timedelta

from sqlalchemy.exc import IntegrityError

from app.models import Employee, Phase, Project, ProjectHoliday, ProjectMember, Task
from app.models.constants import PROJECT_PRIORITY, PROJECT_STATUS
from app.repositories import ProjectRepository
from app.services.notification_service import notify_employee
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_projects():
    return ProjectRepository.list_projects()


def get_project(project_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return project


def create_project(payload: dict):
    name = (payload.get("name") or "").strip()
    if not name:
        raise ApiError("Nama project wajib diisi.")

    status = payload.get("status") or "Planning"
    if status not in PROJECT_STATUS:
        raise ApiError(f"Status tidak valid. Pilihan: {', '.join(PROJECT_STATUS)}")

    priority = payload.get("priority") or None
    if priority and priority not in PROJECT_PRIORITY:
        raise ApiError(f"Prioritas tidak valid. Pilihan: {', '.join(PROJECT_PRIORITY)}")

    manager_id = payload.get("manager_id") or None
    if manager_id and not Employee.query.get(manager_id):
        raise ApiError("Manajer tidak ditemukan.")

    ids = [project.id for project in Project.query.with_entities(Project.id).all()]
    project = Project(
        id=next_string_id(ids, "p", default_start=1),
        name=name,
        status=status,
        description=(payload.get("description") or "").strip() or None,
        priority=priority,
        manager_id=manager_id,
        start_date=payload.get("start_date") or None,
        end_date=payload.get("end_date") or None,
    )
    db.session.add(project)
    db.session.flush()

    phase_ids = [phase.id for phase in Phase.query.with_entities(Phase.id).all()]
    phases_payload = payload.get("phases") or []
    if phases_payload:
        for index, phase_item in enumerate(phases_payload):
            phase_name = (phase_item.get("name") or "").strip()
            if not phase_name:
                continue
            phase = Phase(
                id=next_string_id(phase_ids, "ph-", default_start=1),
                project_id=project.id,
                name=phase_name,
                order_index=index + 1,
            )
            db.session.add(phase)
            phase_ids.append(phase.id)
    else:
        initial_phase = Phase(
            id=next_string_id(phase_ids, "ph-", default_start=1),
            project_id=project.id,
            name="Fase 1: Inisiasi",
            order_index=1,
        )
        db.session.add(initial_phase)

    if manager_id:
        notify_employee(
            employee_id=manager_id,
            title="Anda ditetapkan sebagai manager project",
            message=f"Anda ditugaskan mengelola project {project.name}.",
            entity_type="project",
            entity_id=project.id,
            target_url=f"/proyek/{project.id}",
        )

    db.session.commit()
    return project


def update_project(project_id: str, payload: dict):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            raise ApiError("Nama project wajib diisi.")
        project.name = name

    if "status" in payload and payload["status"]:
        if payload["status"] not in PROJECT_STATUS:
            raise ApiError(f"Status tidak valid. Pilihan: {', '.join(PROJECT_STATUS)}")
        project.status = payload["status"]

    if "description" in payload:
        project.description = (payload.get("description") or "").strip() or None

    if "priority" in payload:
        priority = payload.get("priority") or None
        if priority and priority not in PROJECT_PRIORITY:
            raise ApiError(f"Prioritas tidak valid. Pilihan: {', '.join(PROJECT_PRIORITY)}")
        project.priority = priority

    previous_manager_id = project.manager_id
    if "manager_id" in payload:
        manager_id = payload.get("manager_id") or None
        if manager_id and not Employee.query.get(manager_id):
            raise ApiError("Manajer tidak ditemukan.")
        project.manager_id = manager_id
        if manager_id and manager_id != previous_manager_id:
            notify_employee(
                employee_id=manager_id,
                title="Anda ditetapkan sebagai manager project",
                message=f"Anda ditugaskan mengelola project {project.name}.",
                entity_type="project",
                entity_id=project.id,
                target_url=f"/proyek/{project.id}",
            )

    if "start_date" in payload:
        project.start_date = payload.get("start_date") or None

    if "end_date" in payload:
        project.end_date = payload.get("end_date") or None

    db.session.commit()
    return project


def list_phases(project_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return ProjectRepository.list_phases(project_id)


def create_phase(project_id: str, payload: dict):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    name = (payload.get("name") or "").strip()
    if not name:
        raise ApiError("Nama fase wajib diisi.")

    phases = ProjectRepository.list_phases(project_id)
    phase_ids = [phase.id for phase in Phase.query.with_entities(Phase.id).all()]
    phase = Phase(
        id=next_string_id(phase_ids, "ph-", default_start=1),
        project_id=project_id,
        name=name,
        order_index=len(phases) + 1,
    )
    db.session.add(phase)
    db.session.commit()
    return phase


def list_members(project_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return ProjectRepository.list_members(project_id)


def add_member(project_id: str, payload: dict):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    employee_id = (payload.get("employee_id") or "").strip()
    if not employee_id:
        raise ApiError("employee_id wajib diisi.")

    employee = Employee.query.get(employee_id)
    if not employee:
        raise ApiError("Pegawai tidak ditemukan.", status_code=404)

    existing = ProjectRepository.get_member(project_id, employee_id)
    if existing:
        raise ApiError("Pegawai sudah menjadi anggota project ini.")

    member = ProjectMember(project_id=project_id, employee_id=employee_id)
    db.session.add(member)
    notify_employee(
        employee_id=employee_id,
        title="Anda ditambahkan ke project",
        message=f"Anda ditambahkan sebagai anggota project {project.name}.",
        entity_type="project",
        entity_id=project.id,
        target_url=f"/proyek/{project.id}",
    )
    db.session.commit()
    return member


def remove_member(project_id: str, employee_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    member = ProjectRepository.get_member(project_id, employee_id)
    if not member:
        raise ApiError("Anggota tidak ditemukan dalam project ini.", status_code=404)

    db.session.delete(member)
    db.session.commit()


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _is_working_day(value: date, holidays: set[date]) -> bool:
    return value.weekday() < 5 and value not in holidays


def _calculate_end_date(start_date: date, mandays: int, holidays: set[date]) -> date:
    cursor = start_date
    remaining = mandays
    while True:
        if _is_working_day(cursor, holidays):
            remaining -= 1
            if remaining == 0:
                return cursor
        cursor = cursor + timedelta(days=1)


def _recalculate_project_task_dates(project_id: str):
    holidays = {holiday.holiday_date for holiday in ProjectRepository.list_holidays(project_id)}
    tasks = Task.query.filter(
        Task.project_id == project_id,
        Task.start_date.isnot(None),
        Task.mandays.isnot(None),
    ).all()
    for task in tasks:
        task.end_date = _calculate_end_date(task.start_date, task.mandays, holidays)


def list_holidays(project_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return ProjectRepository.list_holidays(project_id)


def create_holiday(project_id: str, payload: dict):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    holiday_date = _parse_date(payload.get("holiday_date"))
    if not holiday_date:
        raise ApiError("Tanggal libur wajib diisi dengan format tanggal yang valid.", errors={"holiday_date": "invalid"})

    name = (payload.get("name") or "").strip() or "Hari libur"
    holiday = ProjectHoliday(project_id=project_id, holiday_date=holiday_date, name=name)
    db.session.add(holiday)
    try:
        db.session.flush()
        _recalculate_project_task_dates(project_id)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError("Tanggal libur sudah terdaftar untuk project ini.", status_code=409)
    return holiday


def delete_holiday(project_id: str, holiday_id: int):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)

    holiday = ProjectRepository.get_holiday(project_id, holiday_id)
    if not holiday:
        raise ApiError("Hari libur tidak ditemukan.", status_code=404)

    db.session.delete(holiday)
    db.session.flush()
    _recalculate_project_task_dates(project_id)
    db.session.commit()
