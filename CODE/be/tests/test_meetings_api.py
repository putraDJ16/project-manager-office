def _create_meeting(client, auth_headers, **overrides):
    payload = {
        "title": "Sprint Review",
        "description": "Review progres sprint",
        "meeting_type": "Online",
        "meeting_url": "https://meet.example.com/sprint",
        "start_datetime": "2026-05-20T14:00:00+07:00",
        "end_datetime": "2026-05-20T15:00:00+07:00",
        "attendee_ids": ["emp-001"],
        **overrides,
    }
    return client.post("/api/v1/projects/p1/meetings", headers=auth_headers, json=payload)


def test_meeting_crud_and_rsvp_flow(client, auth_headers):
    create_response = _create_meeting(client, auth_headers)
    assert create_response.status_code == 201
    meeting = create_response.get_json()["data"]
    assert meeting["title"] == "Sprint Review"
    assert meeting["attendee_count"] == 1
    meeting_id = meeting["id"]

    list_response = client.get("/api/v1/projects/p1/meetings", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.get_json()["data"]) == 1

    update_response = client.patch(
        f"/api/v1/projects/p1/meetings/{meeting_id}",
        headers=auth_headers,
        json={"location": "Ruang PMO", "meeting_type": "Offline"},
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["data"]["location"] == "Ruang PMO"

    rsvp_response = client.patch(
        f"/api/v1/projects/p1/meetings/{meeting_id}/attendees/rsvp",
        headers=auth_headers,
        json={"rsvp_status": "Accepted"},
    )
    assert rsvp_response.status_code == 200
    assert rsvp_response.get_json()["data"]["rsvp_status"] == "Accepted"

    detail_response = client.get(f"/api/v1/projects/p1/meetings/{meeting_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    assert detail_response.get_json()["data"]["attendees"][0]["rsvp_status"] == "Accepted"


def test_meeting_rejects_invalid_time_range(client, auth_headers):
    response = _create_meeting(
        client,
        auth_headers,
        start_datetime="2026-05-20T15:00:00+07:00",
        end_datetime="2026-05-20T14:00:00+07:00",
    )
    assert response.status_code == 400
    assert "Waktu selesai" in response.get_json()["message"]


def test_my_calendar_returns_only_current_user_projects(client, auth_headers):
    _create_meeting(client, auth_headers, title="Meeting P1", attendee_ids=["emp-001"])
    client.post(
        "/api/v1/projects/p2/meetings",
        headers=auth_headers,
        json={
            "title": "Meeting P2",
            "meeting_type": "Online",
            "start_datetime": "2026-05-21T09:00:00+07:00",
            "end_datetime": "2026-05-21T10:00:00+07:00",
            "attendee_ids": ["emp-002"],
        },
    )

    pm_login = client.post("/api/v1/auth/login", json={"email": "pm@zoho.local", "password": "Pm123456!"})
    pm_headers = {"Authorization": f"Bearer {pm_login.get_json()['data']['access_token']}"}
    calendar = client.get(
        "/api/v1/my-calendar?start_date=2026-05-01&end_date=2026-05-31",
        headers=pm_headers,
    )
    assert calendar.status_code == 200
    titles = {item["title"] for item in calendar.get_json()["data"]}
    assert titles == {"Meeting P2"}


def test_meeting_requires_jwt(client):
    response = client.get("/api/v1/projects/p1/meetings")
    assert response.status_code == 401
