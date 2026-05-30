import re

from app.models import EmailOutbox


def latest_otp_for(email):
    outbox = (
        EmailOutbox.query
        .filter(EmailOutbox.to_email == email)
        .order_by(EmailOutbox.id.desc())
        .first()
    )
    assert outbox is not None
    match = re.search(r"Kode OTP:\s*(\d{6})", outbox.body_text or "")
    assert match is not None
    return match.group(1)


def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"})
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "admin@zoho.local"
    assert data["user"]["onboarding_completed"] is False


def test_login_fail(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "wrong"})
    assert response.status_code == 401


def test_forgot_password_with_otp(client):
    request_response = client.post(
        "/api/v1/auth/forgot-password/request-otp",
        json={"email": "admin@zoho.local"},
    )
    assert request_response.status_code == 200
    assert "Jika email terdaftar" in request_response.get_json()["message"]

    reset_response = client.post(
        "/api/v1/auth/forgot-password/reset",
        json={
            "email": "admin@zoho.local",
            "new_password": "Forgot123!",
            "confirm_password": "Forgot123!",
            "otp": latest_otp_for("admin@zoho.local"),
        },
    )
    assert reset_response.status_code == 200

    old_login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"})
    assert old_login.status_code == 401

    new_login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Forgot123!"})
    assert new_login.status_code == 200


def test_forgot_password_request_does_not_reveal_unknown_email(client):
    response = client.post(
        "/api/v1/auth/forgot-password/request-otp",
        json={"email": "unknown.user@example.com"},
    )
    assert response.status_code == 200
    assert EmailOutbox.query.filter(EmailOutbox.to_email == "unknown.user@example.com").first() is None


def test_register_success(client):
    payload = {
        "name": "User Mandiri",
        "email": "user.mandiri@example.com",
        "password": "Register123!",
        "confirm_password": "Register123!",
        "organization": "ZOHO PM SaaS",
        "unit_organization": "Engineering",
        "position": "Backend Developer",
    }
    otp_response = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert otp_response.status_code == 200

    response = client.post(
        "/api/v1/auth/register",
        json={**payload, "otp": latest_otp_for("user.mandiri@example.com")},
    )
    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["user"]["email"] == "user.mandiri@example.com"

    login = client.post("/api/v1/auth/login", json={"email": "user.mandiri@example.com", "password": "Register123!"})
    assert login.status_code == 200


def test_register_uses_configured_default_role(client, auth_headers):
    role_response = client.post(
        "/api/v1/roles",
        headers=auth_headers,
        json={
            "name": "Staff Kosong",
            "description": "Role default tanpa privilege.",
            "status": "Active",
            "permissions": {},
        },
    )
    assert role_response.status_code == 201
    role_id = role_response.get_json()["data"]["id"]

    default_response = client.patch(f"/api/v1/roles/{role_id}/default", headers=auth_headers)
    assert default_response.status_code == 200

    payload = {
        "name": "User Staff",
        "email": "user.staff@example.com",
        "password": "Register123!",
        "confirm_password": "Register123!",
        "organization": "ZOHO PM SaaS",
        "unit_organization": "Engineering",
        "position": "Backend Developer",
    }
    otp_response = client.post("/api/v1/auth/register/request-otp", json=payload)
    assert otp_response.status_code == 200

    response = client.post(
        "/api/v1/auth/register",
        json={**payload, "otp": latest_otp_for("user.staff@example.com")},
    )
    assert response.status_code == 201
    user = response.get_json()["data"]["user"]
    assert user["role_id"] == role_id
    assert user["role"] == "Staff Kosong"


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
    assert me_data["onboarding_completed"] is False

    refreshed = client.post("/api/v1/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert refreshed.status_code == 200
    assert refreshed.get_json()["data"]["access_token"]


def test_complete_onboarding(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]

    response = client.post("/api/v1/auth/onboarding/complete", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["message"] == "Onboarding selesai."
    assert payload["data"]["onboarding_completed"] is True

    next_login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"})
    assert next_login.get_json()["data"]["user"]["onboarding_completed"] is True


def test_change_password_success(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]

    change_response = client.post(
        "/api/v1/auth/change-password/request-otp",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "current_password": "Admin123!",
            "new_password": "Admin456!",
            "confirm_password": "Admin456!",
        },
    )
    assert change_response.status_code == 200

    change_response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "current_password": "Admin123!",
            "new_password": "Admin456!",
            "confirm_password": "Admin456!",
            "otp": latest_otp_for("admin@zoho.local"),
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


def test_my_assignment_counter(client):
    login = client.post("/api/v1/auth/login", json={"email": "admin@zoho.local", "password": "Admin123!"}).get_json()
    access = login["data"]["access_token"]

    task_response = client.post(
        "/api/v1/tasks",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "title": "Counter assigned task",
            "priority": "Medium",
            "assignee": "emp-001",
            "project_id": "p1",
            "phase_id": "ph-101",
            "progress_percentage": 20,
        },
    )
    assert task_response.status_code == 201

    issue_response = client.post(
        "/api/v1/issues",
        headers={"Authorization": f"Bearer {access}"},
        json={
            "project_id": "p1",
            "title": "Counter assigned issue",
            "severity": "Major",
            "assignee": "Andi Jatmiko",
            "description": "Issue untuk menguji counter assignment.",
            "module": "Dashboard",
            "environment": "Testing",
            "reproduction_steps": ["Buka dashboard"],
            "actual_result": "Counter belum tampil",
            "expected_result": "Counter tampil",
            "attachments": [],
        },
    )
    assert issue_response.status_code == 201

    response = client.get("/api/v1/auth/my-assignment-counter", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["active_tasks"] >= 1
    assert data["active_issues"] >= 1
    assert data["total_active"] == data["active_tasks"] + data["active_issues"]
