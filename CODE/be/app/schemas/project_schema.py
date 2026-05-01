from marshmallow import Schema, fields


class ProjectMemberSchema(Schema):
    project_id = fields.String()
    employee_id = fields.String()
    employee_name = fields.Method("get_employee_name")
    employee_nip = fields.Method("get_employee_nip")
    employee_position = fields.Method("get_employee_position")
    employee_organization = fields.Method("get_employee_organization")
    joined_at = fields.DateTime()

    def get_employee_name(self, obj):
        return obj.employee.name if obj.employee else None

    def get_employee_nip(self, obj):
        return obj.employee.nip if obj.employee else None

    def get_employee_position(self, obj):
        return obj.employee.position if obj.employee else None

    def get_employee_organization(self, obj):
        return obj.employee.organization if obj.employee else None


class ProjectHolidaySchema(Schema):
    id = fields.Integer()
    project_id = fields.String()
    holiday_date = fields.Date(required=True)
    name = fields.String(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class ProjectSchema(Schema):
    id = fields.String()
    name = fields.String()
    status = fields.String()
    description = fields.String(allow_none=True)
    priority = fields.String(allow_none=True)
    manager_id = fields.String(allow_none=True)
    manager_name = fields.Method("get_manager_name")
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    phase_count = fields.Method("get_phase_count")
    task_count = fields.Method("get_task_count")
    member_count = fields.Method("get_member_count")
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_manager_name(self, obj):
        return obj.manager.name if obj.manager else None

    def get_phase_count(self, obj):
        return len(obj.phases) if obj.phases is not None else 0

    def get_task_count(self, obj):
        return len(obj.tasks) if obj.tasks is not None else 0

    def get_member_count(self, obj):
        return len(obj.members) if obj.members is not None else 0


class ProjectDetailSchema(ProjectSchema):
    members = fields.List(fields.Nested(ProjectMemberSchema))


class PhaseSchema(Schema):
    id = fields.String(required=True)
    project_id = fields.String(required=True)
    name = fields.String(required=True)
    order_index = fields.Integer(required=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
