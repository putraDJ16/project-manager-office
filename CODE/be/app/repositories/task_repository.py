from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models import Task, TaskChecklistItem, TaskComment


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
    def query_tasks(
        project_id: str | None = None,
        search: str | None = None,
        phase_id: str | None = None,
        priority: str | None = None,
        assignee: str | None = None,
        status: str | None = None
    ) -> Query:
        """
        Build a filtered query for tasks.
        
        Args:
            project_id: Filter by project
            search: Search term for title
            phase_id: Filter by phase
            priority: Filter by priority
            assignee: Filter by assignee
            status: Filter by status (via progress_percentage)
            
        Returns:
            SQLAlchemy Query object (not executed)
        """
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
        
        if phase_id:
            query = query.filter(Task.phase_id == phase_id)
        
        if priority:
            query = query.filter(Task.priority == priority)
        
        if assignee:
            query = query.filter(Task.assignee.ilike(f'%{assignee}%'))
        
        # Status filter based on progress_percentage
        if status == 'completed':
            query = query.filter(Task.progress_percentage >= 100)
        elif status == 'in_progress':
            query = query.filter(Task.progress_percentage > 0, Task.progress_percentage < 100)
        elif status == 'not_started':
            query = query.filter(Task.progress_percentage == 0)
        
        return query

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

    @staticmethod
    def list_task_checklist_items(task_id: str):
        return (
            TaskChecklistItem.query
            .filter(TaskChecklistItem.task_id == task_id)
            .order_by(TaskChecklistItem.order_index.asc(), TaskChecklistItem.id.asc())
            .all()
        )

    @staticmethod
    def get_task_checklist_item(item_id: int):
        return TaskChecklistItem.query.get(item_id)
