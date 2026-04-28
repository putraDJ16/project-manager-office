from app.extensions import db
from app.models import ProjectAttachmentFile, ProjectAttachmentFolder


class ProjectAttachmentRepository:
    @staticmethod
    def list_folders(project_id: str):
        return (
            ProjectAttachmentFolder.query.filter_by(project_id=project_id)
            .order_by(ProjectAttachmentFolder.parent_id.asc(), ProjectAttachmentFolder.name.asc())
            .all()
        )

    @staticmethod
    def get_folder(folder_id: str):
        return ProjectAttachmentFolder.query.get(folder_id)

    @staticmethod
    def get_sibling_folder_by_name(project_id: str, parent_id: str | None, name: str):
        query = ProjectAttachmentFolder.query.filter_by(project_id=project_id, parent_id=parent_id)
        return query.filter(db.func.lower(ProjectAttachmentFolder.name) == name.lower()).first()

    @staticmethod
    def list_files(project_id: str, folder_id: str | None = None):
        query = ProjectAttachmentFile.query.filter_by(project_id=project_id)
        if folder_id is None:
            query = query.filter(ProjectAttachmentFile.folder_id.is_(None))
        else:
            query = query.filter_by(folder_id=folder_id)
        return query.order_by(ProjectAttachmentFile.created_at.desc()).all()

    @staticmethod
    def list_all_files(project_id: str):
        return ProjectAttachmentFile.query.filter_by(project_id=project_id).order_by(
            ProjectAttachmentFile.created_at.desc()
        ).all()

    @staticmethod
    def get_file(file_id: str):
        return ProjectAttachmentFile.query.get(file_id)
