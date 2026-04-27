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
