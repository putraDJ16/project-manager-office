from sqlalchemy import or_
from sqlalchemy.orm import Query

from app.models import Issue


class IssueRepository:
    @staticmethod
    def list_issues(project_id: str | None = None):
        query = Issue.query
        if project_id:
            query = query.filter(Issue.project_id == project_id)
        return query.order_by(Issue.created_at.desc()).all()
    
    @staticmethod
    def query_issues(
        project_id: str | None = None,
        search: str | None = None,
        status: str | None = None,
        severity: str | None = None
    ) -> Query:
        """
        Build a filtered query for issues.
        
        Args:
            project_id: Filter by project
            search: Search term for title/description
            status: Filter by status
            severity: Filter by severity
            
        Returns:
            SQLAlchemy Query object (not executed)
        """
        query = Issue.query
        
        if project_id:
            query = query.filter(Issue.project_id == project_id)
        
        if search:
            normalized = f"%{search}%"
            query = query.filter(
                or_(
                    Issue.title.ilike(normalized),
                    Issue.description.ilike(normalized)
                )
            )
        
        if status:
            query = query.filter(Issue.status == status)
        
        if severity:
            query = query.filter(Issue.severity == severity)
        
        return query

    @staticmethod
    def get_issue(issue_id: str):
        return Issue.query.get(issue_id)
