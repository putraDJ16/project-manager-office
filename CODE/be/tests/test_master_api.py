def _login(client, email="pm@zoho.local", password="Pm123456!"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_roles_crud(client, auth_headers):
    before = client.get("/api/v1/roles", headers=auth_headers)
    assert before.status_code == 200
    assert len(before.get_json()["data"]) >= 1

    created = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "QA Lead",
            "description": "Lead QA",
            "status": "Active",
            "permissions": {"dashboard": {"view": True}},
        },
    )
    assert created.status_code == 201
    role_id = created.get_json()["data"]["id"]

    updated = client.patch(f"/api/v1/roles/{role_id}", headers=auth_headers, json={"description": "Lead QA Team"})
    assert updated.status_code == 200

    status = client.patch(f"/api/v1/roles/{role_id}/status", headers=auth_headers, json={"status": "Inactive"})
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"


def test_project_manager_cannot_mutate_master_data(client):
    pm_headers = _login(client)

    can_view_organizations = client.get("/api/v1/organizations", headers=pm_headers)
    assert can_view_organizations.status_code == 200

    create_organization = client.post(
        "/api/v1/organizations",
        headers=pm_headers,
        json={"name": "Tidak Boleh Dibuat", "status": "Active"},
    )
    assert create_organization.status_code == 403

    create_employee = client.post(
        "/api/v1/employees",
        headers=pm_headers,
        json={
            "nip": "20000101-998",
            "name": "Unauthorized Employee",
            "email": "unauthorized.employee@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Lead Developer",
            "role_id": "role-001",
            "status": "Active",
        },
    )
    assert create_employee.status_code == 403

    edit_role = client.patch("/api/v1/roles/role-001", headers=pm_headers, json={"description": "Nope"})
    assert edit_role.status_code == 403


def test_operational_role_can_read_references_without_master_menu(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Operational Reference Reader",
            "description": "Bisa membuka menu operasional tanpa akses Data Master.",
            "status": "Active",
            "permissions": {
                "tasks": {"view": True},
                "calendar": {"view": True},
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
            "name": "Operational User",
            "email": "operational.user@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": role_id,
            "status": "Active",
        },
    )
    assert employee_response.status_code == 201

    headers = _login(client, "operational.user@company.co.id", "Welcome123!")

    employees = client.get("/api/v1/employees", headers=headers)
    assert employees.status_code == 200

    projects = client.get("/api/v1/projects", headers=headers)
    assert projects.status_code == 200

    project_detail = client.get("/api/v1/projects/p1", headers=headers)
    assert project_detail.status_code == 200

    create_employee = client.post(
        "/api/v1/employees",
        headers=headers,
        json={
            "nip": "20000101-988",
            "name": "Still Forbidden",
            "email": "still.forbidden@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": "role-001",
            "status": "Active",
        },
    )
    assert create_employee.status_code == 403


def test_employee_crud(client, auth_headers):
    created = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-999",
            "name": "Tes Pegawai",
            "email": "tes.pegawai@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Lead Developer",
            "role_id": "role-001",
            "status": "Active",
        },
    )
    assert created.status_code == 201
    assert "Password default:" in created.get_json().get("message", "")
    employee_id = created.get_json()["data"]["id"]

    login_new_employee = client.post(
        "/api/v1/auth/login",
        json={"email": "tes.pegawai@company.co.id", "password": "Welcome123!"},
    )
    assert login_new_employee.status_code == 200

    updated = client.patch(
        f"/api/v1/employees/{employee_id}",
        headers=auth_headers,
        json={"position": "QA Engineer", "role_id": "role-004"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["position"] == "QA Engineer"
    assert updated.get_json()["data"]["role_id"] == "role-004"

    relogin_updated_employee = client.post(
        "/api/v1/auth/login",
        json={"email": "tes.pegawai@company.co.id", "password": "Welcome123!"},
    )
    assert relogin_updated_employee.status_code == 200
    employee_token = relogin_updated_employee.get_json()["data"]["access_token"]
    profile = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {employee_token}"})
    assert profile.status_code == 200
    assert profile.get_json()["data"]["role_id"] == "role-004"
    assert profile.get_json()["data"]["role"] == "Viewer"

    status = client.patch(
        f"/api/v1/employees/{employee_id}/status", headers=auth_headers, json={"status": "Inactive"}
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"

    login_inactive_employee = client.post(
        "/api/v1/auth/login",
        json={"email": "tes.pegawai@company.co.id", "password": "Welcome123!"},
    )
    assert login_inactive_employee.status_code == 401


def test_employee_reset_password(client, auth_headers):
    created = client.post(
        "/api/v1/employees",
        headers=auth_headers,
        json={
            "nip": "20000101-996",
            "name": "Reset Password Pegawai",
            "email": "reset.password@company.co.id",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
            "role_id": "role-001",
            "status": "Active",
        },
    )
    assert created.status_code == 201
    employee_id = created.get_json()["data"]["id"]

    login_default = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.password@company.co.id", "password": "Welcome123!"},
    )
    assert login_default.status_code == 200
    employee_access_token = login_default.get_json()["data"]["access_token"]

    change_response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {employee_access_token}"},
        json={
            "current_password": "Welcome123!",
            "new_password": "ResetMe123!",
            "confirm_password": "ResetMe123!",
        },
    )
    assert change_response.status_code == 200

    login_changed = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.password@company.co.id", "password": "ResetMe123!"},
    )
    assert login_changed.status_code == 200

    reset_response = client.post(
        f"/api/v1/employees/{employee_id}/reset-password",
        headers=auth_headers,
    )
    assert reset_response.status_code == 200
    assert "Password pegawai berhasil direset" in reset_response.get_json().get("message", "")

    login_old_changed = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.password@company.co.id", "password": "ResetMe123!"},
    )
    assert login_old_changed.status_code == 401

    login_reset = client.post(
        "/api/v1/auth/login",
        json={"email": "reset.password@company.co.id", "password": "Welcome123!"},
    )
    assert login_reset.status_code == 200


def test_email_settings_permissions(client, auth_headers):
    admin_preferences = client.get("/api/v1/me/email-preferences", headers=auth_headers)
    assert admin_preferences.status_code == 200

    updated_preferences = client.put(
        "/api/v1/me/email-preferences",
        headers=auth_headers,
        json={"task_assignment": False},
    )
    assert updated_preferences.status_code == 200
    assert updated_preferences.get_json()["data"]["task_assignment"] is False

    admin_outbox = client.get("/api/v1/admin/email-outbox", headers=auth_headers)
    assert admin_outbox.status_code == 200

    pm_headers = _login(client)
    pm_preferences = client.get("/api/v1/me/email-preferences", headers=pm_headers)
    assert pm_preferences.status_code == 403

    pm_outbox = client.get("/api/v1/admin/email-outbox", headers=pm_headers)
    assert pm_outbox.status_code == 403


def test_organization_crud(client, auth_headers):
    created = client.post(
        "/api/v1/organizations",
        headers=auth_headers,
        json={"name": "Divisi Operasional", "status": "Active"},
    )
    assert created.status_code == 201
    organization_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/organizations/{organization_id}",
        headers=auth_headers,
        json={"name": "Divisi Operasional Nasional"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["name"] == "Divisi Operasional Nasional"

    status = client.patch(
        f"/api/v1/organizations/{organization_id}/status",
        headers=auth_headers,
        json={"status": "Inactive"},
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"


def test_organization_unit_crud(client, auth_headers):
    created = client.post(
        "/api/v1/organization-units",
        headers=auth_headers,
        json={"name": "People Operations", "status": "Active"},
    )
    assert created.status_code == 201
    unit_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/organization-units/{unit_id}",
        headers=auth_headers,
        json={"name": "People Ops"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["name"] == "People Ops"

    status = client.patch(
        f"/api/v1/organization-units/{unit_id}/status",
        headers=auth_headers,
        json={"status": "Inactive"},
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"


def test_position_crud(client, auth_headers):
    created = client.post(
        "/api/v1/positions",
        headers=auth_headers,
        json={"name": "Site Reliability Engineer", "status": "Active"},
    )
    assert created.status_code == 201
    position_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/positions/{position_id}",
        headers=auth_headers,
        json={"name": "Senior Site Reliability Engineer"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["name"] == "Senior Site Reliability Engineer"

    status = client.patch(
        f"/api/v1/positions/{position_id}/status",
        headers=auth_headers,
        json={"status": "Inactive"},
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"
