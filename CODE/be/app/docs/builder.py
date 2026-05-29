from __future__ import annotations

import inspect
import re
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any

from flask import Flask
from marshmallow import Schema, fields

from app.docs.envelopes import ErrorEnvelopeSchema, SuccessEnvelopeSchema

HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE"}
PUBLIC_ENDPOINTS = {
    "login_handler",
    "register_handler",
    "register_options_handler",
}

FEATURE_TAG_BY_MODULE = {
    "admin_email": "Email Notifications",
    "audit_trails": "Audit Trail",
    "auth": "Auth",
    "email_preferences": "Email Notifications",
    "employees": "Master Data",
    "issues": "Issue and SLA",
    "meeting_files": "Meeting Notes",
    "meeting_notes": "Meeting Notes",
    "meetings": "Meeting Agenda",
    "notifications": "Notifications",
    "organization_units": "Master Data",
    "organizations": "Master Data",
    "positions": "Master Data",
    "project_attachments": "Project Attachments",
    "projects": "Project Management",
    "roles": "Master Data",
    "sla": "Issue and SLA",
    "tasks": "Task Management",
}

SCHEMA_BY_MODULE = {
    "admin_email": "EmailOutbox",
    "audit_trails": "AuditTrail",
    "employees": "Employee",
    "issues": "Issue",
    "meeting_files": "MeetingFile",
    "meeting_notes": "MeetingNote",
    "meetings": "Meeting",
    "notifications": "Notification",
    "organization_units": "OrganizationUnit",
    "organizations": "Organization",
    "positions": "Position",
    "project_attachments": "ProjectAttachmentFile",
    "projects": "Project",
    "roles": "Role",
    "sla": "SlaRule",
    "tasks": "Task",
}


def build_openapi_spec(app: Flask) -> dict[str, Any]:
    components = _build_components()
    paths: dict[str, dict[str, Any]] = OrderedDict()

    for rule in sorted(app.url_map.iter_rules(), key=lambda item: item.rule):
        if not rule.rule.startswith("/api/v1/") or rule.rule == "/api/v1/openapi.json":
            continue

        view = app.view_functions[rule.endpoint]
        metadata = _read_apidoc(view)
        if metadata.get("hidden"):
            continue

        path = _openapi_path(rule.rule.removeprefix("/api/v1"))
        paths.setdefault(path, OrderedDict())
        for method in sorted(rule.methods & HTTP_METHODS):
            paths[path][method.lower()] = _operation_for(app, rule, view, method, metadata)

    return {
        "openapi": "3.0.3",
        "info": {
            "title": "PMO Indocyber API",
            "version": app.config.get("API_VERSION", "1.0.0"),
        },
        "servers": [{"url": f"{app.config.get('API_PUBLIC_URL')}/api/v1"}],
        "tags": [{"name": tag} for tag in _ordered_tags(paths)],
        "components": components,
        "paths": paths,
        "x-generated-at": datetime.now(timezone.utc).isoformat(),
    }


def _operation_for(app: Flask, rule, view, method: str, metadata: dict[str, Any]) -> dict[str, Any]:
    module_name = _module_name(view)
    tag = metadata.get("tag") or _tag_for(module_name, rule.rule)
    permissions = metadata.get("permissions") or _permissions_for(view)
    auth_required = _auth_required(view)
    status_code = _success_status(method, view)
    data_schema = _response_schema_for(module_name, rule.rule, method)

    description_parts = []
    if metadata.get("description"):
        description_parts.append(metadata["description"])
    if permissions:
        description_parts.append("**Permissions:** " + ", ".join(permissions))

    operation = {
        "tags": [tag],
        "summary": metadata.get("summary") or _summary_for(method, rule.rule),
        "operationId": f"{rule.endpoint.replace('.', '_')}_{method.lower()}",
        "parameters": _parameters_for(rule, view, metadata),
        "responses": {
            str(status_code): _response("Successful response", data_schema),
            "400": _error_response("Bad request"),
        },
    }
    if description_parts:
        operation["description"] = "\n\n".join(description_parts)
    if auth_required:
        operation["security"] = [{"bearerAuth": []}]
        operation["responses"]["401"] = _error_response("Unauthorized")
    if method in {"POST", "PUT", "PATCH"} and not rule.rule.endswith("/download"):
        operation["requestBody"] = _request_body_for(rule, metadata)

    return operation


def _build_components() -> dict[str, Any]:
    schemas = OrderedDict(
        {
            "SuccessEnvelope": _schema_to_openapi(SuccessEnvelopeSchema()),
            "ErrorEnvelope": _schema_to_openapi(ErrorEnvelopeSchema()),
        }
    )

    import app.schemas as schema_module

    for name in sorted(dir(schema_module)):
        obj = getattr(schema_module, name)
        if inspect.isclass(obj) and issubclass(obj, Schema) and obj is not Schema:
            schemas[name.removesuffix("Schema")] = _schema_to_openapi(obj())

    schemas["EmailPreferences"] = {
        "type": "object",
        "additionalProperties": {"type": "boolean"},
    }
    schemas["EmailOutbox"] = {
        "type": "object",
        "additionalProperties": True,
    }
    schemas["PaginationMeta"] = {
        "type": "object",
        "properties": {
            "page": {"type": "integer"},
            "per_page": {"type": "integer"},
            "total": {"type": "integer"},
            "pages": {"type": "integer"},
        },
    }

    return {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        },
        "schemas": schemas,
    }


def _schema_to_openapi(schema: Schema) -> dict[str, Any]:
    properties = OrderedDict()
    required = []
    for name, field in schema.fields.items():
        if getattr(field, "dump_only", False) is False or True:
            properties[name] = _field_to_openapi(field)
        if getattr(field, "required", False):
            required.append(name)

    result: dict[str, Any] = {"type": "object", "properties": properties}
    if required:
        result["required"] = required
    return result


def _field_to_openapi(field) -> dict[str, Any]:
    if isinstance(field, fields.Nested):
        schema_name = field.schema.__class__.__name__.removesuffix("Schema")
        value: dict[str, Any] = {"$ref": f"#/components/schemas/{schema_name}"}
        if field.many:
            value = {"type": "array", "items": value}
    elif isinstance(field, fields.List):
        value = {"type": "array", "items": _field_to_openapi(field.inner)}
    elif isinstance(field, fields.Dict):
        value = {"type": "object", "additionalProperties": True}
    elif isinstance(field, fields.Integer):
        value = {"type": "integer"}
    elif isinstance(field, fields.Float):
        value = {"type": "number", "format": "float"}
    elif isinstance(field, fields.Boolean):
        value = {"type": "boolean"}
    elif isinstance(field, fields.DateTime):
        value = {"type": "string", "format": "date-time"}
    elif isinstance(field, fields.Date):
        value = {"type": "string", "format": "date"}
    elif isinstance(field, fields.Url):
        value = {"type": "string", "format": "uri"}
    elif isinstance(field, fields.Email):
        value = {"type": "string", "format": "email"}
    elif isinstance(field, fields.String):
        value = {"type": "string"}
    else:
        value = {"nullable": True}

    if getattr(field, "allow_none", False):
        value["nullable"] = True
    if getattr(field, "dump_only", False):
        value["readOnly"] = True
    if getattr(field, "load_only", False):
        value["writeOnly"] = True
    return value


def _parameters_for(rule, view, metadata: dict[str, Any]) -> list[dict[str, Any]]:
    parameters = []
    for name in sorted(rule.arguments):
        converter = rule._converters.get(name)
        parameters.append(
            {
                "name": name,
                "in": "path",
                "required": True,
                "schema": {"type": "integer" if converter.__class__.__name__ == "IntegerConverter" else "string"},
            }
        )

    for query_param in metadata.get("query_params") or _query_params_for(view):
        if isinstance(query_param, str):
            query_param = {"name": query_param}
        parameters.append(
            {
                "name": query_param["name"],
                "in": "query",
                "required": bool(query_param.get("required", False)),
                "schema": query_param.get("schema", {"type": "string"}),
            }
        )
    return parameters


def _query_params_for(view) -> list[str]:
    try:
        source = inspect.getsource(_unwrap(view))
    except (OSError, TypeError):
        return []
    names = set(re.findall(r"request\.args\.get(?:list)?\([\"']([^\"']+)[\"']", source))
    return sorted(names)


def _request_body_for(rule, metadata: dict[str, Any]) -> dict[str, Any]:
    if "files" in rule.rule or "attachments/files" in rule.rule:
        schema = {
            "type": "object",
            "properties": {
                "file": {"type": "string", "format": "binary"},
                "folder_id": {"type": "string", "nullable": True},
                "description": {"type": "string", "nullable": True},
            },
            "required": ["file"],
        }
        return {"required": True, "content": {"multipart/form-data": {"schema": schema}}}

    body = metadata.get("body")
    schema = _schema_ref(body) if body else {"type": "object", "additionalProperties": True}
    return {"required": True, "content": {"application/json": {"schema": schema}}}


def _response(description: str, data_schema: dict[str, Any]) -> dict[str, Any]:
    return {
        "description": description,
        "content": {
            "application/json": {
                "schema": {
                    "allOf": [{"$ref": "#/components/schemas/SuccessEnvelope"}],
                    "properties": {"data": data_schema},
                }
            }
        },
    }


def _error_response(description: str) -> dict[str, Any]:
    return {
        "description": description,
        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorEnvelope"}}},
    }


def _response_schema_for(module_name: str, rule: str, method: str) -> dict[str, Any]:
    if method == "DELETE" or rule.endswith("/read-all") or rule.endswith("/change-password"):
        return {"nullable": True}
    if rule.endswith("/download"):
        return {"type": "string", "format": "binary"}
    if "email-preferences" in rule:
        return {"$ref": "#/components/schemas/EmailPreferences"}
    if "email-outbox" in rule:
        return _ref_or_list("EmailOutbox", method == "GET" and not rule.endswith("/resend"))
    if "my-assignment-counter" in rule:
        return {"type": "object", "additionalProperties": {"type": "integer"}}
    if "register-options" in rule or rule.endswith("/login") or rule.endswith("/register") or rule.endswith("/me"):
        return {"type": "object", "additionalProperties": True}
    if "sla-config" in rule:
        return {"type": "object", "properties": {"rules": {"type": "array", "items": {"$ref": "#/components/schemas/SlaRule"}}}}
    if "calendar" in rule:
        return {"type": "array", "items": {"$ref": "#/components/schemas/CalendarMeeting"}}
    if "comments" in rule:
        return _ref_or_list("TaskComment", method == "GET")
    if "checklist" in rule:
        return _ref_or_list("TaskChecklistItem", method == "GET")
    if "phases" in rule:
        return _ref_or_list("Phase", method == "GET")
    if "members" in rule:
        return _ref_or_list("ProjectMember", method == "GET")
    if "holidays" in rule:
        return _ref_or_list("ProjectHoliday", method == "GET")
    if "folders" in rule:
        return _ref_or_list("ProjectAttachmentFolder", method == "GET")
    if "meeting-notes" in rule:
        return {"type": "array", "items": {"$ref": "#/components/schemas/MeetingNoteSummary"}}
    if "action-items" in rule:
        return {"$ref": "#/components/schemas/MeetingActionItem"}
    if "attendees" in rule:
        return _ref_or_list("MeetingAttendee", method in {"POST"})
    if "notifications" in rule and method == "GET":
        return {
            "type": "object",
            "properties": {
                "items": {"type": "array", "items": {"$ref": "#/components/schemas/Notification"}},
                "unread_count": {"type": "integer"},
            },
        }
    schema_name = SCHEMA_BY_MODULE.get(module_name)
    if not schema_name:
        return {"type": "object", "additionalProperties": True}
    return _ref_or_list(schema_name, method == "GET" and "<" not in rule)


def _ref_or_list(schema_name: str, many: bool) -> dict[str, Any]:
    ref = {"$ref": f"#/components/schemas/{schema_name}"}
    return {"type": "array", "items": ref} if many else ref


def _schema_ref(schema) -> dict[str, Any]:
    if isinstance(schema, type):
        return {"$ref": f"#/components/schemas/{schema.__name__.removesuffix('Schema')}"}
    if isinstance(schema, Schema):
        ref = {"$ref": f"#/components/schemas/{schema.__class__.__name__.removesuffix('Schema')}"}
        return {"type": "array", "items": ref} if schema.many else ref
    return {"type": "object", "additionalProperties": True}


def _read_apidoc(view) -> dict[str, Any]:
    current = view
    while current:
        metadata = getattr(current, "_apidoc", None)
        if metadata:
            return metadata
        current = getattr(current, "__wrapped__", None)
    return {}


def _permissions_for(view) -> list[str]:
    current = view
    while current:
        permissions = getattr(current, "_required_permissions", None)
        if permissions:
            return permissions
        current = getattr(current, "__wrapped__", None)
    return []


def _auth_required(view) -> bool:
    if _unwrap(view).__name__ in PUBLIC_ENDPOINTS:
        return False
    return True


def _success_status(method: str, view) -> int:
    try:
        source = inspect.getsource(_unwrap(view))
    except (OSError, TypeError):
        source = ""
    if "status_code=201" in source:
        return 201
    return 200


def _summary_for(method: str, rule: str) -> str:
    action = {
        "GET": "Get",
        "POST": "Create",
        "PUT": "Replace",
        "PATCH": "Update",
        "DELETE": "Delete",
    }[method]
    name = rule.removeprefix("/api/v1/").replace("<string:", "{").replace("<int:", "{").replace(">", "}")
    return f"{action} {name}"


def _openapi_path(rule: str) -> str:
    return re.sub(r"<(?:[^:<>]+:)?([^<>]+)>", r"{\1}", rule)


def _module_name(view) -> str:
    return _unwrap(view).__module__.rsplit(".", 1)[-1]


def _tag_for(module_name: str, rule: str) -> str:
    if rule == "/api/v1/my-calendar":
        return "Personal Calendar"
    return FEATURE_TAG_BY_MODULE.get(module_name, "API")


def _ordered_tags(paths: dict[str, dict[str, Any]]) -> list[str]:
    ordered = []
    for operations in paths.values():
        for operation in operations.values():
            for tag in operation.get("tags", []):
                if tag not in ordered:
                    ordered.append(tag)
    return ordered


def _unwrap(view):
    current = view
    while getattr(current, "__wrapped__", None) is not None:
        current = current.__wrapped__
    return current
