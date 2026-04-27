from app.extensions import db
from app.models import Phase, Project
from app.repositories import ProjectRepository
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id


def list_projects():
    return ProjectRepository.list_projects()


def create_project(payload: dict):
    name = (payload.get("name") or "").strip()
    if not name:
        raise ApiError("Nama project wajib diisi.")

    ids = [project.id for project in Project.query.with_entities(Project.id).all()]
    project = Project(
        id=next_string_id(ids, "p", default_start=1),
        name=name,
        status=(payload.get("status") or "Planning"),
    )
    db.session.add(project)
    db.session.flush()

    phase_ids = [phase.id for phase in Phase.query.with_entities(Phase.id).all()]
    initial_phase = Phase(
        id=next_string_id(phase_ids, "ph-", default_start=1),
        project_id=project.id,
        name="Fase 1: Inisiasi",
        order_index=1,
    )
    db.session.add(initial_phase)
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
        project.status = payload["status"]
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
