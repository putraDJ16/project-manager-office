from marshmallow import Schema, fields


class MeetingAttendeeSchema(Schema):
    meeting_id = fields.Integer()
    employee_id = fields.String()
    employee_name = fields.Method("get_employee_name")
    rsvp_status = fields.String()
    attended = fields.Boolean()

    def get_employee_name(self, obj):
        return obj.employee.name if obj.employee else None


class MeetingActionItemSchema(Schema):
    id = fields.Integer()
    meeting_note_id = fields.Integer()
    description = fields.String()
    assignee_employee_id = fields.String(allow_none=True)
    assignee_name = fields.Method("get_assignee_name")
    due_date = fields.Date(allow_none=True)
    is_done = fields.Boolean()
    order_index = fields.Integer()

    def get_assignee_name(self, obj):
        return obj.assignee.name if obj.assignee else None


class MeetingFileSchema(Schema):
    id = fields.Integer()
    meeting_id = fields.Integer()
    original_name = fields.String()
    mime_type = fields.String(allow_none=True)
    size_bytes = fields.Integer()
    description = fields.String(allow_none=True)
    uploaded_by = fields.Integer(allow_none=True)
    uploader_name = fields.Method("get_uploader_name")
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_uploader_name(self, obj):
        return obj.uploader.display_name if obj.uploader else None


class MeetingNoteSchema(Schema):
    id = fields.Integer()
    meeting_id = fields.Integer()
    summary = fields.String(allow_none=True)
    notes = fields.String(allow_none=True)
    decisions = fields.List(fields.String())
    created_by = fields.Integer(allow_none=True)
    last_edited_by = fields.Integer(allow_none=True)
    last_edited_by_name = fields.Method("get_last_edited_by_name")
    action_items = fields.List(fields.Nested(MeetingActionItemSchema))
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_last_edited_by_name(self, obj):
        return obj.last_editor.display_name if obj.last_editor else None


class MeetingSchema(Schema):
    id = fields.Integer()
    project_id = fields.String()
    project_name = fields.Method("get_project_name")
    title = fields.String()
    description = fields.String(allow_none=True)
    location = fields.String(allow_none=True)
    meeting_type = fields.String()
    meeting_url = fields.String(allow_none=True)
    start_datetime = fields.DateTime()
    end_datetime = fields.DateTime()
    status = fields.String()
    effective_status = fields.Method("get_effective_status")
    created_by = fields.Integer(allow_none=True)
    created_by_name = fields.Method("get_created_by_name")
    attendees = fields.List(fields.Nested(MeetingAttendeeSchema))
    attendee_count = fields.Method("get_attendee_count")
    note = fields.Nested(MeetingNoteSchema, allow_none=True)
    files = fields.List(fields.Nested(MeetingFileSchema))
    files_count = fields.Method("get_files_count")
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_created_by_name(self, obj):
        return obj.creator.display_name if obj.creator else None

    def get_attendee_count(self, obj):
        return len(obj.attendees or [])

    def get_files_count(self, obj):
        return len(obj.files or [])

    def get_effective_status(self, obj):
        if obj.status == "Cancelled":
            return "Cancelled"
        from app.services.meeting_service import effective_meeting_status

        return effective_meeting_status(obj)


class MeetingNoteSummarySchema(Schema):
    meeting_id = fields.Integer()
    title = fields.String()
    start_datetime = fields.DateTime()
    summary = fields.String(allow_none=True)
    decisions_count = fields.Integer()
    action_items_open = fields.Integer()
    action_items_total = fields.Integer()
    files_count = fields.Integer()
    last_edited_by = fields.String(allow_none=True)
    updated_at = fields.DateTime()


class CalendarMeetingSchema(Schema):
    meeting_id = fields.Integer()
    project_id = fields.String()
    project_name = fields.String()
    title = fields.String()
    start_datetime = fields.DateTime()
    end_datetime = fields.DateTime()
    meeting_type = fields.String()
    meeting_url = fields.String(allow_none=True)
    status = fields.String()
    my_rsvp = fields.String(allow_none=True)
