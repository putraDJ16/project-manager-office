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


def test_project_create_accepts_rasci_assignment(client, auth_headers):
    created = client.post(
        "/api/v1/projects",
        headers=auth_headers,
        json={
            "name": "Project RASCI API",
            "status": "Planning",
            "rasci": {
                "responsible": ["emp-001"],
                "accountable": "emp-002",
                "support": ["emp-003"],
                "consulted": [],
                "informed": [],
            },
        },
    )
    assert created.status_code == 201
    data = created.get_json()["data"]
    assert data["manager_id"] == "emp-002"
    assert data["rasci"]["accountable"] == "emp-002"
    assert data["rasci"]["responsible"] == ["emp-001"]
    assert data["member_count"] == 3


def test_project_member_can_be_added_with_rasci_roles(client, auth_headers):
    added = client.post(
        "/api/v1/projects/p2/members",
        headers=auth_headers,
        json={"employee_id": "emp-003", "rasci_roles": ["support", "consulted"]},
    )
    assert added.status_code == 201

    project = client.get("/api/v1/projects/p2", headers=auth_headers)
    assert project.status_code == 200
    data = project.get_json()["data"]
    assert "emp-003" in data["rasci"]["support"]
    assert "emp-003" in data["rasci"]["consulted"]


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
