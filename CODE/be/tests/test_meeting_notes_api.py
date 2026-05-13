def _create_meeting(client, auth_headers):
    return client.post(
        "/api/v1/projects/p1/meetings",
        headers=auth_headers,
        json={
            "title": "Sprint Review",
            "meeting_type": "Online",
            "start_datetime": "2026-05-20T14:00:00+07:00",
            "end_datetime": "2026-05-20T15:00:00+07:00",
            "attendee_ids": ["emp-001"],
        },
    )


def test_meeting_note_upsert_summary_and_action_items(client, auth_headers):
    meeting_id = _create_meeting(client, auth_headers).get_json()["data"]["id"]

    upsert = client.put(
        f"/api/v1/projects/p1/meetings/{meeting_id}/note",
        headers=auth_headers,
        json={
            "summary": "Go-live ditunda satu minggu.",
            "notes": "Diskusi migrasi data dan risiko.",
            "decisions": ["Go-live 27 Mei 2026"],
            "action_items": [
                {
                    "description": "Siapkan mitigasi risiko",
                    "assignee_employee_id": "emp-001",
                    "due_date": "2026-05-18",
                    "is_done": False,
                }
            ],
        },
    )
    assert upsert.status_code == 200
    note = upsert.get_json()["data"]
    assert note["summary"] == "Go-live ditunda satu minggu."
    assert len(note["action_items"]) == 1
    item_id = note["action_items"][0]["id"]

    update_item = client.patch(
        f"/api/v1/projects/p1/meetings/{meeting_id}/note/action-items/{item_id}",
        headers=auth_headers,
        json={"is_done": True},
    )
    assert update_item.status_code == 200
    assert update_item.get_json()["data"]["is_done"] is True

    summary = client.get("/api/v1/projects/p1/meeting-notes?search=go-live", headers=auth_headers)
    assert summary.status_code == 200
    data = summary.get_json()["data"]
    assert len(data) == 1
    assert data[0]["action_items_total"] == 1

    delete_item = client.delete(
        f"/api/v1/projects/p1/meetings/{meeting_id}/note/action-items/{item_id}",
        headers=auth_headers,
    )
    assert delete_item.status_code == 200


def test_meeting_note_open_action_filter(client, auth_headers):
    meeting_id = _create_meeting(client, auth_headers).get_json()["data"]["id"]
    client.put(
        f"/api/v1/projects/p1/meetings/{meeting_id}/note",
        headers=auth_headers,
        json={"summary": "Ada follow up", "action_items": [{"description": "Follow up vendor"}]},
    )

    response = client.get("/api/v1/projects/p1/meeting-notes?has_open_action=true", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 1
