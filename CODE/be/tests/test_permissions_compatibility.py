def _login(client, email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_legacy_issues_permission_grants_project_issue_access(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Legacy Issues Role",
            "description": "Role lama dengan key issues",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "issues": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-996",
            "name": "Legacy Issue User",
            "email": "legacy.issue.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "legacy.issue.user@company.co.id", "Welcome123!")
    issue_list_response = client.get("/api/v1/issues", headers=headers)
    assert issue_list_response.status_code == 200


def test_issue_create_requires_create_permission(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Issue View Only",
            "description": "Role hanya boleh melihat isu.",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "projectIssues": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-989",
            "name": "Issue View Only User",
            "email": "issue.view.only.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "issue.view.only.user@company.co.id", "Welcome123!")
    issue_list_response = client.get("/api/v1/issues?project_id=p1", headers=headers)
    assert issue_list_response.status_code == 200

    create_response = client.post(
        "/api/v1/issues",
        headers=headers,
        json={
            "project_id": "p1",
            "title": "Harus Ditolak",
            "severity": "Major",
            "reporter": "Issue View Only User",
            "description": "User view-only tidak boleh membuat isu.",
            "module": "Permission",
            "environment": "Testing",
            "reproduction_steps": ["Buka form lapor bug"],
            "actual_result": "Form terlihat",
            "expected_result": "Form tidak terlihat",
            "attachments": [],
        },
    )
    assert create_response.status_code == 403


def test_master_projects_permission_does_not_grant_project_detail_tabs(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Legacy Project Role",
            "description": "Role dengan akses daftar proyek saja",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "masterProjects": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-995",
            "name": "Legacy Project User",
            "email": "legacy.project.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "legacy.project.user@company.co.id", "Welcome123!")

    projects_response = client.get("/api/v1/projects", headers=headers)
    assert projects_response.status_code == 200

    phases_response = client.get("/api/v1/projects/p1/phases", headers=headers)
    assert phases_response.status_code == 200

    members_response = client.get("/api/v1/projects/p1/members", headers=headers)
    assert members_response.status_code == 403

    folders_response = client.get("/api/v1/projects/p1/attachments/folders", headers=headers)
    assert folders_response.status_code == 403

    tasks_response = client.get("/api/v1/tasks?project_id=p1", headers=headers)
    assert tasks_response.status_code == 403

    issue_list_response = client.get("/api/v1/issues", headers=headers)
    assert issue_list_response.status_code == 403


def test_project_gantt_permission_grants_read_only_gantt_data(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Project Gantt Viewer",
            "description": "Role untuk melihat tab gantt proyek",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "projectGantt": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-994",
            "name": "Gantt Viewer User",
            "email": "gantt.viewer.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "gantt.viewer.user@company.co.id", "Welcome123!")

    projects_response = client.get("/api/v1/projects", headers=headers)
    assert projects_response.status_code == 200

    phases_response = client.get("/api/v1/projects/p1/phases", headers=headers)
    assert phases_response.status_code == 200

    tasks_response = client.get("/api/v1/tasks?project_id=p1", headers=headers)
    assert tasks_response.status_code == 200

    employees_response = client.get("/api/v1/employees", headers=headers)
    assert employees_response.status_code == 200

    create_task_response = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={
            "project_id": "p1",
            "title": "Should not create",
            "priority": "Medium",
        },
    )
    assert create_task_response.status_code == 403


def test_my_tasks_permission_does_not_grant_project_tasks_tab_access(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "My Tasks Only",
            "description": "Role hanya untuk menu Tugas Saya.",
            "status": "Active",
            "permissions": {
                "dashboard": {"view": True},
                "tasks": {"view": True},
                "masterProjects": {"view": True},
            },
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    employee_response = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-993",
            "name": "My Tasks Only User",
            "email": "my.tasks.only.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "my.tasks.only.user@company.co.id", "Welcome123!")

    all_tasks_response = client.get("/api/v1/tasks", headers=headers)
    assert all_tasks_response.status_code == 200

    project_tasks_response = client.get("/api/v1/tasks?project_id=p1", headers=headers)
    assert project_tasks_response.status_code == 403
