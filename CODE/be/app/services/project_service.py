from app.extensions import db
from datetime import date, timedelta

from sqlalchemy.exc import IntegrityError

from app.models import Employee, Phase, Project, ProjectHoliday, ProjectMember, Task
from app.models.constants import PROJECT_PRIORITY, PROJECT_STATUS
from app.repositories import ProjectRepository
from app.services.notification_service import notify_employee
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


RASCI_LIST_KEYS = ("responsible", "support", "consulted", "informed")
RASCI_ROLE_KEYS = (*RASCI_LIST_KEYS, "accountable")


def list_projects():
    return ProjectRepository.list_projects()


def list_projects_paginated(
    per_page: int,
    cursor_payload: dict | None,
    request,
    search: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    manager_id: str | None = None
) -> dict:
    """
    Get paginated list of projects with filters.
    
    Args:
        per_page: Number of items per page
        cursor_payload: Decoded cursor dict or None
        request: Flask request object
        search: Search term for project name
        status: Filter by status
        priority: Filter by priority
        manager_id: Filter by manager
        
    Returns:
        Dict with items, meta, and links
    """
    from app.utils.pagination import paginate
    from app.schemas import projects_schema
    
    # Get filtered query
    query = ProjectRepository.query_projects(
        search=search,
        status=status,
        priority=priority,
        manager_id=manager_id
    )
    
    # Sort spec: name ASC, id ASC (id as tie-breaker)
    sort_spec = [
        (Project.name, 'asc'),
        (Project.id, 'asc')
    ]
    
    # Paginate
    result = paginate(query, sort_spec, per_page, cursor_payload, request)
    
    # Serialize items
    result['items'] = projects_schema.dump(result['items'])
    
    return result


def get_project(project_id: str):
    project = ProjectRepository.get_project(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return project


def _normalize_id_list(value) -> list[str]:
    if value is None or value == "":
        return []
    if isinstance(value, str):
        values = [value]
    elif isinstance(value, list):
        values = value
    else:
        values = []
    return list(dict.fromkeys(str(item).strip() for item in values if str(item).strip()))


def _validate_employee_ids(employee_ids: set[str]):
    if not employee_ids:
        return
    existing_ids = {
        employee.id
        for employee in Employee.query.with_entities(Employee.id).filter(Employee.id.in_(employee_ids)).all()
    }
    missing_ids = sorted(employee_ids - existing_ids)
    if missing_ids:
        raise ApiError("Pegawai RASCI tidak ditemukan.", errors={"rasci": missing_ids})


def _normalize_rasci(payload: dict | None, manager_id: str | None = None, prefer_manager: bool = False):
    payload = payload or {}
    payload_accountable = payload.get("accountable") or payload.get("accountable_id") or None
    accountable = (manager_id or payload_accountable) if prefer_manager else (payload_accountable or manager_id)
    accountable = str(accountable).strip() if accountable else None

    normalized = {
        "responsible": _normalize_id_list(payload.get("responsible") or payload.get("responsible_ids")),
        "accountable": accountable,
        "support": _normalize_id_list(payload.get("support") or payload.get("support_ids")),
        "consulted": _normalize_id_list(payload.get("consulted") or payload.get("consulted_ids")),
        "informed": _normalize_id_list(payload.get("informed") or payload.get("informed_ids")),
    }
    employee_ids = set(normalized["responsible"])
    employee_ids.update(normalized["support"])
    employee_ids.update(normalized["consulted"])
    employee_ids.update(normalized["informed"])
    if normalized["accountable"]:
        employee_ids.add(normalized["accountable"])
    _validate_employee_ids(employee_ids)
    return normalized


def _rasci_employee_ids(rasci: dict | None) -> set[str]:
    rasci = rasci or {}
    employee_ids = set()
    for key in RASCI_LIST_KEYS:
        employee_ids.update(_normalize_id_list(rasci.get(key)))
    accountable = (rasci.get("accountable") or "").strip()
    if accountable:
        employee_ids.add(accountable)
    return employee_ids


def _add_rasci_members(project_id: str, rasci: dict | None):
    for employee_id in _rasci_employee_ids(rasci):
        if not ProjectRepository.get_member(project_id, employee_id):
            db.session.add(ProjectMember(project_id=project_id, employee_id=employee_id))


def _normalize_rasci_roles(value) -> set[str]:
    if value is None or value == "":
        return set()
    values = [value] if isinstance(value, str) else value if isinstance(value, list) else []
    roles = {str(item).strip() for item in values if str(item).strip()}
    invalid_roles = sorted(roles - set(RASCI_ROLE_KEYS))
    if invalid_roles:
        raise ApiError("Role RASCI tidak valid.", errors={"rasci_roles": invalid_roles})
    return roles


def _assign_employee_to_rasci(project: Project, employee_id: str, roles: set[str]):
    if not roles:
        return
    rasci = _normalize_rasci(project.rasci, project.manager_id)
    for role in RASCI_LIST_KEYS:
        if role in roles and employee_id not in rasci[role]:
            rasci[role].append(employee_id)
    if "accountable" in roles:
        rasci["accountable"] = employee_id
        project.manager_id = employee_id
    project.rasci = rasci


def _remove_employee_from_rasci(project: Project, employee_id: str):
    rasci = _normalize_rasci(project.rasci, project.manager_id)
    for role in RASCI_LIST_KEYS:
        rasci[role] = [item for item in rasci[role] if item != employee_id]
    if rasci["accountable"] == employee_id:
        rasci["accountable"] = None
        project.manager_id = None
    project.rasci = rasci


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

    raw_rasci = payload.get("rasci") or {}
    manager_id = payload.get("manager_id") or raw_rasci.get("accountable") or raw_rasci.get("accountable_id") or None
    rasci = _normalize_rasci(raw_rasci, manager_id)
    manager_id = rasci["accountable"]

    ids = [project.id for project in Project.query.with_entities(Project.id).all()]
    project = Project(
        id=next_string_id(ids, "p", default_start=1),
        name=name,
        status=status,
        description=(payload.get("description") or "").strip() or None,
        priority=priority,
        manager_id=manager_id,
        rasci=rasci,
        start_date=payload.get("start_date") or None,
        end_date=payload.get("end_date") or None,
    )
    db.session.add(project)
    db.session.flush()
    _add_rasci_members(project.id, project.rasci)

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
        if "rasci" not in payload:
            project.rasci = _normalize_rasci(project.rasci, manager_id, prefer_manager=True)
            _add_rasci_members(project.id, project.rasci)
        if manager_id and manager_id != previous_manager_id:
            notify_employee(
                employee_id=manager_id,
                title="Anda ditetapkan sebagai manager project",
                message=f"Anda ditugaskan mengelola project {project.name}.",
                entity_type="project",
                entity_id=project.id,
                target_url=f"/proyek/{project.id}",
            )

    if "rasci" in payload:
        rasci = _normalize_rasci(payload.get("rasci"), project.manager_id)
        project.rasci = rasci
        project.manager_id = rasci["accountable"]
        _add_rasci_members(project.id, rasci)
        if project.manager_id and project.manager_id != previous_manager_id:
            notify_employee(
                employee_id=project.manager_id,
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
    _assign_employee_to_rasci(project, employee_id, _normalize_rasci_roles(payload.get("rasci_roles")))
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

    _remove_employee_from_rasci(project, employee_id)
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
