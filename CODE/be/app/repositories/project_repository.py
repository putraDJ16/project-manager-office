from app.models import Phase, Project


class ProjectRepository:
    @staticmethod
    def list_projects():
        return Project.query.order_by(Project.name.asc()).all()

    @staticmethod
    def get_project(project_id: str):
        return Project.query.get(project_id)

    @staticmethod
    def list_phases(project_id: str):
        return Phase.query.filter_by(project_id=project_id).order_by(Phase.order_index.asc()).all()

    @staticmethod
    def get_phase(phase_id: str):
        return Phase.query.get(phase_id)
