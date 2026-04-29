from app.models import Issue


class IssueRepository:
    @staticmethod
    def list_issues(project_id: str | None = None):
        query = Issue.query
        if project_id:
            query = query.filter(Issue.project_id == project_id)
        return query.order_by(Issue.created_at.desc()).all()

    @staticmethod
    def get_issue(issue_id: str):
        return Issue.query.get(issue_id)
