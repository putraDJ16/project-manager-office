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
            "position": "Developer",
            "role_id": "role-001",
            "status": "Active",
        },
    )
    assert created.status_code == 201
    employee_id = created.get_json()["data"]["id"]

    updated = client.patch(
        f"/api/v1/employees/{employee_id}",
        headers=auth_headers,
        json={"position": "Senior Developer"},
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["position"] == "Senior Developer"

    status = client.patch(
        f"/api/v1/employees/{employee_id}/status", headers=auth_headers, json={"status": "Inactive"}
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["status"] == "Inactive"
