from marshmallow import Schema, fields


class ProjectAttachmentFolderSchema(Schema):
    id = fields.String(required=True)
    project_id = fields.String(required=True)
    name = fields.String(required=True)
    parent_id = fields.String(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class ProjectAttachmentFileSchema(Schema):
    id = fields.String(required=True)
    project_id = fields.String(required=True)
    folder_id = fields.String(allow_none=True)
    original_name = fields.String(required=True)
    mime_type = fields.String(allow_none=True)
    size_bytes = fields.Integer(required=True)
    description = fields.String(allow_none=True)
    uploaded_by = fields.String(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
