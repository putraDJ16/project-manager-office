import re

from app.models import EmailOutbox


def _latest_otp_for(email):
    outbox = (
        EmailOutbox.query
        .filter(EmailOutbox.to_email == email)
        .order_by(EmailOutbox.id.desc())
        .first()
    )
    assert outbox is not None
    match = re.search(r"Kode OTP:\s*(\d{6})", outbox.body_text or "")
    assert match is not None
    return match.group(1)


def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_issue_and_sla_endpoints(client, auth_headers):
    issues = client.get("/api/v1/issues", headers=auth_headers)
    assert issues.status_code == 200
    base_count = len(issues.get_json()["data"])

    created = client.post(
        "/api/v1/issues",
        headers=auth_headers,
        json={
            "project_id": "p1",
            "title": "Bug API Test",
            "severity": "Major",
            "reporter": "Tester",
            "assignee": "Andi J.",
            "module": "UI",
            "environment": "Local",
            "description": "Testing bug",
            "reproduction_steps": ["step 1", "step 2"],
            "actual_result": "error",
            "expected_result": "ok",
            "attachments": ["screen.png"],
        },
    )
    assert created.status_code == 201
    issue_id = created.get_json()["data"]["id"]

    after = client.get("/api/v1/issues", headers=auth_headers)
    assert len(after.get_json()["data"]) == base_count + 1
    filtered = client.get("/api/v1/issues?project_id=p1", headers=auth_headers)
    assert filtered.status_code == 200
    assert any(issue["id"] == issue_id for issue in filtered.get_json()["data"])

    status = client.patch(f"/api/v1/issues/{issue_id}/status", headers=auth_headers, json={"status": "In Progress"})
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "In Progress"

    escalated = client.post(f"/api/v1/issues/{issue_id}/escalate", headers=auth_headers)
    assert escalated.status_code == 200
    assert escalated.get_json()["data"]["status"] == "Escalated"

    sla = client.get("/api/v1/sla-config", headers=auth_headers)
    assert sla.status_code == 200
    rules = sla.get_json()["data"]["rules"]
    assert len(rules) == 5

    updated = client.put(
        "/api/v1/sla-config",
        headers=auth_headers,
        json={"rules": [{"severity": "Major", "target_hours": 12, "auto_escalate": False, "escalation_delay_minutes": 99}]},
    )
    assert updated.status_code == 200
    next_rules = updated.get_json()["data"]["rules"]
    major_rule = next(rule for rule in next_rules if rule["severity"] == "Major")
    assert major_rule["target_hours"] == 12


def test_issue_status_only_reporter_or_assignee_can_update(client, auth_headers):
    created = client.post(
        "/api/v1/issues",
        headers=auth_headers,
        json={
            "project_id": "p1",
            "title": "Bug Permission Status",
            "severity": "Major",
            "assignee": "Project Manager",
        },
    )
    assert created.status_code == 201
    issue_id = created.get_json()["data"]["id"]

    pm_headers = _login(client, "pm@zoho.local", "Pm123456!")
    status_by_assignee = client.patch(
        f"/api/v1/issues/{issue_id}/status", headers=pm_headers, json={"status": "Investigating"}
    )
    assert status_by_assignee.status_code == 200
    assert status_by_assignee.get_json()["data"]["status"] == "Investigating"

    register_payload = {
        "name": "Outsider User",
        "email": "outsider.user@company.co.id",
        "password": "Outsider123!",
        "confirm_password": "Outsider123!",
        "organization": "ZOHO PM SaaS",
        "unit_organization": "Engineering",
        "position": "Backend Developer",
    }
    otp_response = client.post("/api/v1/auth/register/request-otp", json=register_payload)
    assert otp_response.status_code == 200
    register = client.post(
        "/api/v1/auth/register",
        json={**register_payload, "otp": _latest_otp_for("outsider.user@company.co.id")},
    )
    assert register.status_code == 201
    outsider_headers = _login(client, "outsider.user@company.co.id", "Outsider123!")

    status_by_outsider = client.patch(
        f"/api/v1/issues/{issue_id}/status", headers=outsider_headers, json={"status": "Resolved"}
    )
    assert status_by_outsider.status_code == 403
    assert "pelapor atau assignee" in status_by_outsider.get_json()["message"]


def test_issue_status_change_recorded_in_audit_trail_note(client, auth_headers):
    created = client.post(
        "/api/v1/issues",
        headers=auth_headers,
        json={
            "project_id": "p1",
            "title": "Bug Audit Status",
            "severity": "Major",
            "assignee": "Project Manager",
        },
    )
    assert created.status_code == 201
    issue_id = created.get_json()["data"]["id"]

    updated = client.patch(f"/api/v1/issues/{issue_id}/status", headers=auth_headers, json={"status": "In Progress"})
    assert updated.status_code == 200

    audit = client.get("/api/v1/audit-trails?per_page=100", headers=auth_headers)
    assert audit.status_code == 200
    items = audit.get_json()["data"]["items"]
    status_logs = [
        item
        for item in items
        if item["path"] == f"/api/v1/issues/{issue_id}/status" and item["method"] == "PATCH" and item["status_code"] == 200
    ]
    assert status_logs
    assert "status changed from 'Open' to 'In Progress'" in (status_logs[0]["note"] or "")
