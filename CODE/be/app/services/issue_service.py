from app.extensions import db
from app.models import Issue, SlaRule
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


def update_issue_status(issue_id: str, status: str):
    issue = IssueRepository.get_issue(issue_id)
    if not issue:
        raise ApiError("Isu tidak ditemukan.", status_code=404)
    issue.status = status
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
