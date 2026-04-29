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
        json={"position": "QA Engineer"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["position"] == "QA Engineer"

    status = client.patch(
        f"/api/v1/employees/{employee_id}/status", headers=auth_headers, json={"status": "Inactive"}
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"


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
