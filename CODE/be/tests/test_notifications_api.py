def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_notification_created_for_project_assignment(client, auth_headers):
    created = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={"name": "Project Notifikasi API", "status": "Planning", "manager_id": "emp-002"},
    )
    assert created.status_code == 201

    pm_headers = _login(client, "pm@zoho.local", "Pm123456!")
    notifications = client.get("/api/v1/notifications", headers=pm_headers)
    assert notifications.status_code == 200

    payload = notifications.get_json()["data"]
    assert payload["unread_count"] >= 1
    first_notification = payload["items"][0]
    assert first_notification["entity_type"] == "project"
    assert first_notification["is_read"] is False

    read = client.patch(f"/api/v1/notifications/{first_notification['id']}/read", headers=pm_headers)
    assert read.status_code == 200
    assert read.get_json()["data"]["is_read"] is True


def test_notification_created_for_issue_assignment(client, auth_headers):
    created = client.post(
        "/api/v1/issues",
        headers=auth_headers,
        json={
            "project_id": "p1",
            "title": "Issue Notifikasi API",
            "severity": "Major",
            "reporter": "Manual Reporter",
            "assignee": "Project Manager",
            "module": "Notification",
            "environment": "Test",
            "description": "Testing notification",
            "reproduction_steps": ["create issue"],
            "actual_result": "issue assigned",
            "expected_result": "notification created",
            "attachments": [],
        },
    )
    assert created.status_code == 201

    pm_headers = _login(client, "pm@zoho.local", "Pm123456!")
    notifications = client.get("/api/v1/notifications", headers=pm_headers)
    assert notifications.status_code == 200
    assert any(item["entity_type"] == "issue" for item in notifications.get_json()["data"]["items"])
