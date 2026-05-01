def test_projects_phases_tasks_flow(client, auth_headers):
    projects = client.get("/api/v1/projects", headers=auth_headers)
    assert projects.status_code == 200
    assert len(projects.get_json()["data"]) >= 1

    created_project = client.post(
        "/api/v1/projects", headers=auth_headers, json={"name": "Project API Test", "status": "Planning"}
    )
    assert created_project.status_code == 201
    project_id = created_project.get_json()["data"]["id"]

    phases = client.get(f"/api/v1/projects/{project_id}/phases", headers=auth_headers)
    assert phases.status_code == 200
    assert len(phases.get_json()["data"]) == 1
    phase_id = phases.get_json()["data"][0]["id"]

    created_task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Task dari API",
            "priority": "Medium",
            "assignee": "u1",
            "project_id": project_id,
            "phase_id": phase_id,
            "progress_percentage": 35,
        },
    )
    assert created_task.status_code == 201
    created_task_data = created_task.get_json()["data"]
    assert created_task_data["created_by"] == "Administrator"
    assert created_task_data["phase_updated_at"] is None
    assert created_task_data["progress_percentage"] == 35
    task_id = created_task.get_json()["data"]["id"]

    listed = client.get(f"/api/v1/tasks?project_id={project_id}", headers=auth_headers)
    assert listed.status_code == 200
    assert any(task["id"] == task_id for task in listed.get_json()["data"])

    created_phase = client.post(
        f"/api/v1/projects/{project_id}/phases",
        headers=auth_headers,
        json={"name": "Fase 2 API Test"},
    )
    assert created_phase.status_code == 201
    next_phase_id = created_phase.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/tasks/{task_id}",
        headers=auth_headers,
        json={"title": "Task Updated", "priority": "High", "phase_id": next_phase_id, "progress_percentage": 80},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["title"] == "Task Updated"
    assert updated.get_json()["data"]["phase_id"] == next_phase_id
    assert updated.get_json()["data"]["phase_updated_at"] is not None
    assert updated.get_json()["data"]["progress_percentage"] == 80

    listed_comments = client.get(f"/api/v1/tasks/{task_id}/comments", headers=auth_headers)
    assert listed_comments.status_code == 200
    assert listed_comments.get_json()["data"] == []

    created_comment = client.post(
        f"/api/v1/tasks/{task_id}/comments",
        headers=auth_headers,
        json={"content": "Komentar pertama untuk task ini."},
    )
    assert created_comment.status_code == 201
    created_comment_data = created_comment.get_json()["data"]
    assert created_comment_data["task_id"] == task_id
    assert created_comment_data["author_name"] == "Administrator"
    assert created_comment_data["content"] == "Komentar pertama untuk task ini."

    listed_comments_after_create = client.get(f"/api/v1/tasks/{task_id}/comments", headers=auth_headers)
    assert listed_comments_after_create.status_code == 200
    listed_comment_rows = listed_comments_after_create.get_json()["data"]
    assert len(listed_comment_rows) == 1
    assert listed_comment_rows[0]["content"] == "Komentar pertama untuk task ini."


def test_task_mandays_skip_weekends_and_project_holidays(client, auth_headers):
    created_project = client.post(
        "/api/v1/projects", headers=auth_headers, json={"name": "Project Mandays API Test", "status": "Planning"}
    )
    assert created_project.status_code == 201
    project_id = created_project.get_json()["data"]["id"]

    phases = client.get(f"/api/v1/projects/{project_id}/phases", headers=auth_headers)
    assert phases.status_code == 200
    phase_id = phases.get_json()["data"][0]["id"]

    created_task = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={
            "title": "Task mandays API",
            "priority": "Medium",
            "assignee": "u1",
            "project_id": project_id,
            "phase_id": phase_id,
            "start_date": "2026-05-01",
            "mandays": 2,
        },
    )
    assert created_task.status_code == 201
    task_data = created_task.get_json()["data"]
    assert task_data["mandays"] == 2
    assert task_data["end_date"] == "2026-05-04"

    created_holiday = client.post(
        f"/api/v1/projects/{project_id}/holidays",
        headers=auth_headers,
        json={"holiday_date": "2026-05-04", "name": "Libur test"},
    )
    assert created_holiday.status_code == 201
    holiday_id = created_holiday.get_json()["data"]["id"]

    listed_after_holiday = client.get(f"/api/v1/tasks?project_id={project_id}", headers=auth_headers)
    assert listed_after_holiday.status_code == 200
    recalculated_task = next(task for task in listed_after_holiday.get_json()["data"] if task["id"] == task_data["id"])
    assert recalculated_task["end_date"] == "2026-05-05"

    deleted_holiday = client.delete(f"/api/v1/projects/{project_id}/holidays/{holiday_id}", headers=auth_headers)
    assert deleted_holiday.status_code == 200

    listed_after_delete = client.get(f"/api/v1/tasks?project_id={project_id}", headers=auth_headers)
    assert listed_after_delete.status_code == 200
    restored_task = next(task for task in listed_after_delete.get_json()["data"] if task["id"] == task_data["id"])
    assert restored_task["end_date"] == "2026-05-04"


def test_project_task_comments_can_be_restricted_per_role(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Task Viewer Without Comments",
            "description": "Dapat melihat tugas proyek tanpa komentar.",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "masterProjects": {"view": True},
                "projectPhases": {"view": True},
                "projectTasks": {"view": True},
                "projectTaskComments": {"view": False, "create": False, "edit": False, "delete": False, "restore": False},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-997",
            "name": "Komentar Terbatas",
            "email": "komentar.terbatas@company.co.id",
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
        json={"email": "komentar.terbatas@company.co.id", "password": "Welcome123!"},
    )
    assert login_response.status_code == 200
    headers = {"Authorization": f"Bearer {login_response.get_json()['data']['access_token']}"}

    tasks = client.get("/api/v1/tasks?project_id=p1", headers=headers)
    assert tasks.status_code == 200

    comments = client.get("/api/v1/tasks/T-101/comments", headers=headers)
    assert comments.status_code == 403
