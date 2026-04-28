from app.models import Phase, Project, ProjectMember


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

    @staticmethod
    def list_members(project_id: str):
        return (
            ProjectMember.query
            .filter_by(project_id=project_id)
            .order_by(ProjectMember.joined_at.asc())
            .all()
        )

    @staticmethod
    def get_member(project_id: str, employee_id: str):
        return ProjectMember.query.filter_by(
            project_id=project_id, employee_id=employee_id
        ).first()
