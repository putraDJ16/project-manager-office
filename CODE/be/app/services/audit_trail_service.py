from typing import Any

from flask import Request, Response
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import desc, insert

from app.extensions import db
from app.models import AuditTrail
from app.utils.exceptions import ApiError

SENSITIVE_KEYS = {
    "password",
    "password_hash",
    "access_token",
    "refresh_token",
    "token",
    "authorization",
    "secret",
}

METHOD_TO_ACTION = {
    "GET": "VIEW",
    "POST": "CREATE",
    "PUT": "UPDATE",
    "PATCH": "UPDATE",
    "DELETE": "DELETE",
}


def _is_sensitive_key(key: str):
    key_lower = key.lower()
    if key_lower in SENSITIVE_KEYS:
        return True
    if key_lower.endswith("_token"):
        return True
    if "password" in key_lower:
        return True
    return False


def _sanitize_value(value: Any, field_name: str | None = None):
    if field_name and _is_sensitive_key(field_name):
        return "***REDACTED***"

    if isinstance(value, dict):
        return {str(key): _sanitize_value(item, str(key)) for key, item in value.items()}

    if isinstance(value, list):
        return [_sanitize_value(item, field_name) for item in value]

    if isinstance(value, str) and len(value) > 1000:
        return f"{value[:1000]}...<truncated>"

    return value


def _extract_request_body(req: Request):
    json_payload = req.get_json(silent=True)
    if json_payload is not None:
        return _sanitize_value(json_payload)

    form_payload = req.form.to_dict(flat=False) if req.form else {}
    file_names = [storage.filename for storage in req.files.values()] if req.files else []
    if form_payload or file_names:
        return _sanitize_value({"form": form_payload, "files": file_names})

    return None


def _extract_query_params(req: Request):
    if not req.args:
        return None
    normalized: dict[str, str | list[str]] = {}
    for key in req.args.keys():
        values = req.args.getlist(key)
        normalized[key] = values[0] if len(values) == 1 else values
    return _sanitize_value(normalized)


def _extract_actor_from_jwt():
    user_id = None
    user_email = None

    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        claims = get_jwt() or {}
        user_id = int(identity) if identity not in (None, "") else None
        user_email = claims.get("email")
    except Exception:
        user_id = None
        user_email = None

    return user_id, user_email


def _extract_actor_for_login(response: Response):
    body = response.get_json(silent=True) or {}
    data = body.get("data") or {}
    user_data = data.get("user") or {}
    user_id = user_data.get("id")
    user_email = user_data.get("email")

    try:
        normalized_user_id = int(user_id) if user_id is not None else None
    except (TypeError, ValueError):
        normalized_user_id = None

    return normalized_user_id, user_email


def _build_action(method: str, path: str):
    action_prefix = METHOD_TO_ACTION.get(method.upper(), "CALL")
    return f"{action_prefix} {path}"


def should_log_request(req: Request):
    if not req.path.startswith("/api/v1"):
        return False
    if req.method.upper() == "OPTIONS":
        return False
    return True


def record_from_request(req: Request, response: Response):
    if not should_log_request(req):
        return

    user_id, user_email = _extract_actor_from_jwt()
    if req.path == "/api/v1/auth/login" and response.status_code < 400:
        login_user_id, login_user_email = _extract_actor_for_login(response)
        user_id = login_user_id
        user_email = login_user_email or user_email

    user_agent = req.user_agent.string if req.user_agent else None
    note = None
    if req.path == "/api/v1/auth/login" and response.status_code >= 400:
        note = "Failed login attempt"

    payload = {
        "user_id": user_id,
        "user_email": user_email,
        "action": _build_action(req.method, req.path),
        "method": req.method.upper(),
        "path": req.path,
        "status_code": response.status_code,
        "ip_address": req.remote_addr,
        "user_agent": user_agent[:255] if user_agent else None,
        "request_query": _extract_query_params(req),
        "request_body": _extract_request_body(req),
        "note": note,
    }

    try:
        with db.engine.begin() as connection:
            connection.execute(insert(AuditTrail.__table__).values(**payload))
    except Exception:
        # Audit logging should never break main request flow.
        pass


def list_audit_trails(
    page: int = 1,
    per_page: int = 20,
    user_id: int | None = None,
    method: str | None = None,
    path: str | None = None,
    status_code: int | None = None,
):
    if page < 1:
        raise ApiError("page minimal 1.")
    if per_page < 1 or per_page > 100:
        raise ApiError("per_page harus di antara 1 sampai 100.")

    query = AuditTrail.query

    if user_id is not None:
        query = query.filter(AuditTrail.user_id == user_id)
    if method:
        query = query.filter(AuditTrail.method == method.upper())
    if path:
        query = query.filter(AuditTrail.path == path)
    if status_code is not None:
        query = query.filter(AuditTrail.status_code == status_code)

    total = query.count()
    items = (
        query.order_by(desc(AuditTrail.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": items,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if total else 0,
        },
    }
