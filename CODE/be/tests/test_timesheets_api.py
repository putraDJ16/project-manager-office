def _create_task_for_assignee(client, auth_headers, assignee: str):
    created = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Task untuk timesheet",
            "priority": "Medium",
            "assignee": assignee,
            "project_id": "p1",
            "phase_id": "ph-101",
            "progress_percentage": 10,
        },
    )
    assert created.status_code == 201
    data = created.get_json()["data"]
    return data["id"], data["project_id"]


def test_my_timesheet_crud_flow(client, auth_headers):
    task_id, project_id = _create_task_for_assignee(client, auth_headers, "u1")

    created = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={
            "task_id": task_id,
            "project_id": project_id,
            "work_date": "2026-05-28",
            "hours_spent": 6.5,
            "notes": "Implement endpoint dan validasi.",
        },
    )
    assert created.status_code == 201
    created_data = created.get_json()["data"]
    assert created_data["task_id"] == task_id
    assert created_data["hours_spent"] == 6.5
    assert created_data["task_title"] == "Task untuk timesheet"
    timesheet_id = created_data["id"]

    listed = client.get("/api/v1/my-timesheets", headers=auth_headers)
    assert listed.status_code == 200
    assert any(item["id"] == timesheet_id for item in listed.get_json()["data"])

    updated = client.patch(
        f"/api/v1/my-timesheets/{timesheet_id}",
        headers=auth_headers,
        json={"hours_spent": 7, "notes": "Update pekerjaan hari ini."},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["hours_spent"] == 7

    deleted = client.delete(f"/api/v1/my-timesheets/{timesheet_id}", headers=auth_headers)
    assert deleted.status_code == 200

    listed_after_delete = client.get("/api/v1/my-timesheets", headers=auth_headers)
    assert listed_after_delete.status_code == 200
    assert all(item["id"] != timesheet_id for item in listed_after_delete.get_json()["data"])


def test_my_timesheet_allows_multiple_entries_same_task_same_day(client, auth_headers):
    task_id, project_id = _create_task_for_assignee(client, auth_headers, "u1")

    first = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={"project_id": project_id, "task_id": task_id, "work_date": "2026-05-28", "hours_spent": 2},
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={"project_id": project_id, "task_id": task_id, "work_date": "2026-05-28", "hours_spent": 1.5},
    )
    assert second.status_code == 201
    assert second.get_json()["data"]["id"] != first.get_json()["data"]["id"]


def test_user_cannot_create_timesheet_for_task_outside_assignment_or_membership(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Timesheet Limited User",
            "description": "User untuk validasi akses timesheet.",
            "status": "Active",
            "permissions": {"dashboard": {"view": True}, "projectTasks": {"view": True}},
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-995",
            "name": "Timesheet Terbatas",
            "email": "timesheet.terbatas@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "timesheet.terbatas@company.co.id", "password": "Welcome123!"},
    )
    assert login_response.status_code == 200
    limited_headers = {"Authorization": f"Bearer {login_response.get_json()['data']['access_token']}"}

    task_id, project_id = _create_task_for_assignee(client, auth_headers, "u1")
    forbidden = client.post(
        "/api/v1/my-timesheets",
        headers=limited_headers,
        json={"project_id": project_id, "task_id": task_id, "work_date": "2026-05-28", "hours_spent": 2},
    )
    assert forbidden.status_code == 403


def test_project_timesheets_returns_all_member_entries(client, auth_headers):
    task_id, project_id = _create_task_for_assignee(client, auth_headers, "u1")
    created = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={"project_id": project_id, "task_id": task_id, "work_date": "2026-05-27", "hours_spent": 5, "notes": "Sinkronisasi API"},
    )
    assert created.status_code == 201

    listed = client.get(f"/api/v1/projects/{project_id}/timesheets", headers=auth_headers)
    assert listed.status_code == 200
    rows = listed.get_json()["data"]
    assert any(item["task_id"] == task_id for item in rows)


def test_project_timesheets_requires_project_timesheet_permission(client, auth_headers):
    task_id, project_id = _create_task_for_assignee(client, auth_headers, "u1")
    created = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={"project_id": project_id, "task_id": task_id, "work_date": "2026-05-27", "hours_spent": 5},
    )
    assert created.status_code == 201

    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Project Task Without Timesheet",
            "description": "Bisa melihat tugas proyek tanpa rekap timesheet.",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "masterProjects": {"view": True},
                "projectTasks": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-992",
            "name": "Project Task No Timesheet",
            "email": "project.task.no.timesheet@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "project.task.no.timesheet@company.co.id", "password": "Welcome123!"},
    )
    assert login_response.status_code == 200
    limited_headers = {"Authorization": f"Bearer {login_response.get_json()['data']['access_token']}"}

    listed_tasks = client.get(f"/api/v1/tasks?project_id={project_id}", headers=limited_headers)
    assert listed_tasks.status_code == 200

    forbidden_timesheets = client.get(f"/api/v1/projects/{project_id}/timesheets", headers=limited_headers)
    assert forbidden_timesheets.status_code == 403

    role_with_timesheet = client.patch(
        f"/api/v1/roles/{role_id}",
        headers=auth_headers,
        json={
            "permissions": {
                "dashboard": {"view": True},
                "masterProjects": {"view": True},
                "projectTasks": {"view": True},
                "projectTimesheets": {"view": True},
            },
        },
    )
    assert role_with_timesheet.status_code == 200

    allowed_timesheets = client.get(f"/api/v1/projects/{project_id}/timesheets", headers=limited_headers)
    assert allowed_timesheets.status_code == 200


def test_my_timesheet_can_be_created_without_task(client, auth_headers):
    created = client.post(
        "/api/v1/my-timesheets",
        headers=auth_headers,
        json={"project_id": "p1", "work_date": "2026-05-29", "hours_spent": 3.5, "notes": "Koordinasi harian"},
    )
    assert created.status_code == 201
    data = created.get_json()["data"]
    assert data["task_id"] is None
    assert data["project_id"] == "p1"
