from app.models import TaskTimesheet


class TimesheetRepository:
    @staticmethod
    def list_by_user(user_id: int, start_date=None, end_date=None):
        query = TaskTimesheet.query.filter(TaskTimesheet.user_id == user_id)
        if start_date:
            query = query.filter(TaskTimesheet.work_date >= start_date)
        if end_date:
            query = query.filter(TaskTimesheet.work_date <= end_date)
        return query.order_by(TaskTimesheet.work_date.desc(), TaskTimesheet.id.desc()).all()

    @staticmethod
    def get_by_id(timesheet_id: int):
        return TaskTimesheet.query.get(timesheet_id)

    @staticmethod
    def list_by_project(project_id: str, start_date=None, end_date=None):
        query = TaskTimesheet.query.filter(TaskTimesheet.project_id == project_id)
        if start_date:
            query = query.filter(TaskTimesheet.work_date >= start_date)
        if end_date:
            query = query.filter(TaskTimesheet.work_date <= end_date)
        return query.order_by(TaskTimesheet.work_date.desc(), TaskTimesheet.id.desc()).all()
