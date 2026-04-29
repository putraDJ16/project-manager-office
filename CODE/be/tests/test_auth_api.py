def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"})
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "admin@zoho.local"


def test_login_fail(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "wrong"})
    assert response.status_code == 401


def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "User Mandiri",
            "email": "user.mandiri@example.com",
            "password": "Register123!",
            "confirm_password": "Register123!",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
        },
    )
    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "user.mandiri@example.com"

    login = client.post("/api/v1/auth/login", json={"email": "user.mandiri@example.com", "password": "Register123!"})
    assert login.status_code == 200


def test_register_options(client):
    response = client.get("/api/v1/auth/register-options")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert {"id": "org-001", "name": "ZOHO PM SaaS"} in data["organizations"]
    assert {"id": "unit-001", "name": "Engineering"} in data["organization_units"]
    assert {"id": "pos-004", "name": "Backend Developer"} in data["positions"]


def test_register_duplicate_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin Duplicate",
            "email": "admin@zoho.local",
            "password": "Register123!",
            "confirm_password": "Register123!",
            "organization": "ZOHO PM SaaS",
            "unit_organization": "Engineering",
            "position": "Backend Developer",
        },
    )
    assert response.status_code == 409


def test_auth_me_and_refresh(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]
    refresh = login["data"]["refresh_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    me_data = me.get_json()["data"]
    assert me_data["id"] == login["data"]["user"]["id"]
    assert me_data["email"] == "admin@zoho.local"
    assert me_data["name"] == "Administrator"
    assert me_data["role"] == "Administrator"
    assert me_data["organization"] == "ZOHO PM SaaS"
    assert me_data["unit_organization"] == "Engineering"
    assert me_data["position"] == "Lead Developer"

    refreshed = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert refreshed.status_code == 200
    assert refreshed.get_json()["data"]["access_token"]


def test_change_password_success(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]

    change_response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "current_password": "Admin123!",
            "new_password": "Admin456!",
            "confirm_password": "Admin456!",
        },
    )
    assert change_response.status_code == 200

    old_login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"})
    assert old_login.status_code == 401

    new_login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin456!"})
    assert new_login.status_code == 200


def test_my_projects(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]

    response = client.get("/api/v1/auth/my-projects", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200

    ids = {project["id"] for project in response.get_json()["data"]}
    assert "p1" in ids
    assert "p3" in ids
