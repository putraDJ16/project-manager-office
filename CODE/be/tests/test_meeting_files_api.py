import io


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


def test_meeting_file_upload_download_delete_flow(client, auth_headers):
    meeting_id = _create_meeting(client, auth_headers).get_json()["data"]["id"]

    upload = client.post(
        f"/api/v1/projects/p1/meetings/{meeting_id}/files",
        headers=auth_headers,
        data={
            "description": "Materi rapat",
            "file": (io.BytesIO(b"isi materi"), "materi.txt"),
        },
        content_type="multipart/form-data",
    )
    assert upload.status_code == 201
    file_id = upload.get_json()["data"]["id"]

    list_files = client.get(f"/api/v1/projects/p1/meetings/{meeting_id}/files", headers=auth_headers)
    assert list_files.status_code == 200
    assert len(list_files.get_json()["data"]) == 1

    download = client.get(
        f"/api/v1/projects/p1/meetings/{meeting_id}/files/{file_id}/download",
        headers=auth_headers,
    )
    assert download.status_code == 200
    assert download.data == b"isi materi"

    delete = client.delete(f"/api/v1/projects/p1/meetings/{meeting_id}/files/{file_id}", headers=auth_headers)
    assert delete.status_code == 200


def test_meeting_file_rejects_unsupported_type(client, auth_headers):
    meeting_id = _create_meeting(client, auth_headers).get_json()["data"]["id"]
    upload = client.post(
        f"/api/v1/projects/p1/meetings/{meeting_id}/files",
        headers=auth_headers,
        data={"file": (io.BytesIO(b"bad"), "script.exe")},
        content_type="multipart/form-data",
    )
    assert upload.status_code == 400
    assert "tidak didukung" in upload.get_json()["message"]
