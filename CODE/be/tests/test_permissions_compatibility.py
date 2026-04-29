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


def test_legacy_master_projects_permission_grants_members_and_attachments_access(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Legacy Project Role",
            "description": "Role lama dengan akses masterProjects",
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

    members_response = client.get("/api/v1/projects/p1/members", headers=headers)
    assert members_response.status_code == 200

    folders_response = client.get("/api/v1/projects/p1/attachments/folders", headers=headers)
    assert folders_response.status_code == 200
