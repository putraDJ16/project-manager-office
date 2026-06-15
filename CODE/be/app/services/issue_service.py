from app.extensions import db
from app.models import Issue, SlaRule, User
from app.repositories import IssueRepository
from app.services.notification_service import notify_employee
from app.utils.exceptions import ApiError
from app.utils.ids import next_string_id

SEVERITY_ORDER = ["Blocker", "Critical", "Major", "Minor", "Trivial"]

DEFAULT_SLA_RULES = {
    "Blocker": {"target_hours": 2, "auto_escalate": True, "escalation_delay_minutes": 15},
    "Critical": {"target_hours": 4, "auto_escalate": True, "escalation_delay_minutes": 30},
    "Major": {"target_hours": 8, "auto_escalate": True, "escalation_delay_minutes": 60},
    "Minor": {"target_hours": 24, "auto_escalate": False, "escalation_delay_minutes": 120},
    "Trivial": {"target_hours": 48, "auto_escalate": False, "escalation_delay_minutes": 240},
}


def list_issues(project_id: str | None = None):
    return IssueRepository.list_issues(project_id=project_id)


def list_issues_paginated(
    per_page: int,
    cursor_payload: dict | None,
    request,
    project_id: str | None = None,
    search: str | None = None,
    status: str | None = None,
    severity: str | None = None
) -> dict:
    """
    Get paginated list of issues with filters.
    
    Args:
        per_page: Number of items per page
        cursor_payload: Decoded cursor dict or None
        request: Flask request object
        project_id: Filter by project
        search: Search term for title/description
        status: Filter by status
        severity: Filter by severity
        
    Returns:
        Dict with items, meta, and links
    """
    from app.utils.pagination import paginate
    from app.schemas import issues_schema
    
    # Get filtered query
    query = IssueRepository.query_issues(
        project_id=project_id,
        search=search,
        status=status,
        severity=severity
    )
    
    # Sort spec: created_at DESC, id DESC (newest first)
    sort_spec = [
        (Issue.created_at, 'desc'),
        (Issue.id, 'desc')
    ]
    
    # Paginate
    result = paginate(query, sort_spec, per_page, cursor_payload, request)
    
    # Serialize items
    result['items'] = issues_schema.dump(result['items'])
    
    return result


def get_issue(issue_id: str):
    return IssueRepository.get_issue(issue_id)


def create_issue(payload: dict, reporter_from_claim: str | None = None):
    title = (payload.get("title") or "").strip()
    project_id = (payload.get("project_id") or "").strip()
    reporter = (reporter_from_claim or payload.get("reporter") or "").strip()
    severity = (payload.get("severity") or "Major").strip()
    if not title or not project_id or not reporter:
        raise ApiError("Project, judul, dan pelapor wajib diisi.")

    ids = [issue.id for issue in Issue.query.with_entities(Issue.id).all()]
    issue = Issue(
        id=next_string_id(ids, "BUG-", default_start=201),
        project_id=project_id,
        title=title,
        severity=severity,
        status="Open",
        reporter=reporter,
        assignee=(payload.get("assignee") or "").strip() or None,
        description=(payload.get("description") or "Belum ada deskripsi tambahan.").strip(),
        module=(payload.get("module") or "General").strip(),
        environment=(payload.get("environment") or "Unspecified").strip(),
        reproduction_steps=_normalize_list(payload.get("reproduction_steps")),
        actual_result=(payload.get("actual_result") or "Belum diisi").strip(),
        expected_result=(payload.get("expected_result") or "Belum diisi").strip(),
        attachments=_normalize_list(payload.get("attachments")),
    )
    db.session.add(issue)
    if issue.assignee:
        notify_employee(
            employee_name=issue.assignee,
            title="Isu baru ditugaskan kepada Anda",
            message=f"Anda menjadi assignee untuk isu {issue.title}.",
            entity_type="issue",
            entity_id=issue.id,
            target_url=f"/proyek/{issue.project_id}",
        )
    db.session.commit()
    return issue


def update_issue_status(issue_id: str, status: str, actor: User | None = None):
    issue = IssueRepository.get_issue(issue_id)
    if not issue:
        raise ApiError("Isu tidak ditemukan.", status_code=404)

    normalized_status = (status or "").strip()
    if not normalized_status:
        raise ApiError("Status isu wajib diisi.")
    valid_statuses = {"Open", "Investigating", "In Progress", "Escalated", "Resolved"}
    if normalized_status not in valid_statuses:
        raise ApiError("Status isu tidak valid.")

    if actor and not _is_issue_status_actor(issue, actor):
        raise ApiError("Hanya pelapor atau assignee yang dapat mengubah status isu.", status_code=403)

    issue.status = normalized_status
    db.session.commit()
    return issue


def escalate_issue(issue_id: str):
    return update_issue_status(issue_id, "Escalated")


def get_sla_config():
    rules = SlaRule.query.order_by(SlaRule.id.asc()).all()
    if not rules:
        return _ensure_default_sla_rules()
    return rules


def update_sla_config(payload: dict):
    incoming = payload.get("rules") or []
    incoming_by_severity = {rule.get("severity"): rule for rule in incoming if rule.get("severity")}
    current_by_severity = {rule.severity: rule for rule in SlaRule.query.all()}

    for severity in SEVERITY_ORDER:
        defaults = DEFAULT_SLA_RULES[severity]
        source = incoming_by_severity.get(severity, defaults)
        target_hours = _sanitize_number(source.get("target_hours"), defaults["target_hours"], 1, 720)
        auto_escalate = bool(source.get("auto_escalate", defaults["auto_escalate"]))
        escalation_delay = _sanitize_number(
            source.get("escalation_delay_minutes"), defaults["escalation_delay_minutes"], 0, 4320
        )

        existing = current_by_severity.get(severity)
        if existing:
            existing.target_hours = target_hours
            existing.auto_escalate = auto_escalate
            existing.escalation_delay_minutes = escalation_delay
        else:
            db.session.add(
                SlaRule(
                    severity=severity,
                    target_hours=target_hours,
                    auto_escalate=auto_escalate,
                    escalation_delay_minutes=escalation_delay,
                )
            )

    db.session.commit()
    return SlaRule.query.order_by(SlaRule.id.asc()).all()


def _ensure_default_sla_rules():
    rules = []
    for severity in SEVERITY_ORDER:
        defaults = DEFAULT_SLA_RULES[severity]
        rules.append(
            SlaRule(
                severity=severity,
                target_hours=defaults["target_hours"],
                auto_escalate=defaults["auto_escalate"],
                escalation_delay_minutes=defaults["escalation_delay_minutes"],
            )
        )
    db.session.add_all(rules)
    db.session.commit()
    return rules


def _normalize_list(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _sanitize_number(value, fallback: int, min_value: int, max_value: int):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(min_value, min(max_value, parsed))


def _is_issue_status_actor(issue: Issue, actor: User):
    aliases = _build_actor_aliases(actor)
    reporter = (issue.reporter or "").strip().lower()
    assignee = (issue.assignee or "").strip().lower()
    return reporter in aliases or (assignee and assignee in aliases)


def _build_actor_aliases(actor: User):
    employee = actor.employee if actor.employee_id else None
    aliases = {
        str(actor.id).strip().lower(),
        (actor.display_name or "").strip().lower(),
        (actor.email or "").strip().lower(),
        (actor.employee_id or "").strip().lower(),
    }
    if employee:
        aliases.update(
            {
                (employee.id or "").strip().lower(),
                (employee.name or "").strip().lower(),
                (employee.email or "").strip().lower(),
                (_abbreviated_name(employee.name) or "").strip().lower(),
            }
        )
    aliases.add((_abbreviated_name(actor.display_name) or "").strip().lower())
    return {alias for alias in aliases if alias}


def _abbreviated_name(name: str | None):
    parts = [part for part in (name or "").strip().split(" ") if part]
    if len(parts) < 2:
        return parts[0] if parts else None
    return f"{parts[0]} {parts[1][0]}."
