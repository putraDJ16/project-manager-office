from marshmallow import Schema, fields


class TaskTimesheetSchema(Schema):
    id = fields.Integer(required=True)
    task_id = fields.String(allow_none=True)
    user_id = fields.Integer(required=True)
    project_id = fields.String(required=True)
    work_date = fields.Date(required=True)
    hours_spent = fields.Float(required=True)
    notes = fields.String(allow_none=True)
    task_title = fields.Method("get_task_title")
    employee_name = fields.Method("get_employee_name")
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_task_title(self, obj):
        return obj.task.title if getattr(obj, "task", None) else None

    def get_employee_name(self, obj):
        if getattr(obj, "user", None) and getattr(obj.user, "employee", None):
            return obj.user.employee.name
        if getattr(obj, "user", None):
            return obj.user.display_name
        return None
