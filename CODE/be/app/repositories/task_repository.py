from sqlalchemy import or_

from app.models import Task, TaskComment


class TaskRepository:
    @staticmethod
    def list_tasks(project_id: str | None = None, search: str | None = None):
        query = Task.query
        if project_id:
            query = query.filter(Task.project_id == project_id)
        if search:
            normalized = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Task.id.ilike(normalized),
                    Task.title.ilike(normalized),
                    Task.assignee.ilike(normalized),
                )
            )
        return query.order_by(Task.id.asc()).all()

    @staticmethod
    def get_task(task_id: str):
        return Task.query.get(task_id)

    @staticmethod
    def list_task_comments(task_id: str):
        return (
            TaskComment.query
            .filter(TaskComment.task_id == task_id)
            .order_by(TaskComment.created_at.asc(), TaskComment.id.asc())
            .all()
        )
