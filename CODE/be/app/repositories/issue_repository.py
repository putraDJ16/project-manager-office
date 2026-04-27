from app.models import Issue


class IssueRepository:
    @staticmethod
    def list_issues():
        return Issue.query.order_by(Issue.created_at.desc()).all()

    @staticmethod
    def get_issue(issue_id: str):
        return Issue.query.get(issue_id)
