import io


def test_project_attachment_folder_and_file_flow(client, auth_headers):
    folders_before = client.get("/api/v1/projects/p1/attachments/folders", headers=auth_headers)
    assert folders_before.status_code == 200
    assert folders_before.get_json()["data"] == []

    root_folder = client.post(
        "/api/v1/projects/p1/attachments/folders",
        headers=auth_headers,
        json={"name": "Dokumen"},
    )
    assert root_folder.status_code == 201
    root_folder_id = root_folder.get_json()["data"]["id"]

    child_folder = client.post(
        "/api/v1/projects/p1/attachments/folders",
        headers=auth_headers,
        json={"name": "Kontrak", "parent_id": root_folder_id},
    )
    assert child_folder.status_code == 201
    child_folder_id = child_folder.get_json()["data"]["id"]

    upload = client.post(
        "/api/v1/projects/p1/attachments/files",
        headers=auth_headers,
        data={
            "folder_id": child_folder_id,
            "description": "Kontrak kerja sama",
            "file": (io.BytesIO(b"contoh isi kontrak"), "kontrak.txt"),
        },
        content_type="multipart/form-data",
    )
    assert upload.status_code == 201
    file_id = upload.get_json()["data"]["id"]
    assert upload.get_json()["data"]["description"] == "Kontrak kerja sama"

    list_in_folder = client.get(
        f"/api/v1/projects/p1/attachments/files?folder_id={child_folder_id}",
        headers=auth_headers,
    )
    assert list_in_folder.status_code == 200
    assert len(list_in_folder.get_json()["data"]) == 1

    update_description = client.patch(
        f"/api/v1/projects/p1/attachments/files/{file_id}",
        headers=auth_headers,
        json={"description": "Kontrak final"},
    )
    assert update_description.status_code == 200
    assert update_description.get_json()["data"]["description"] == "Kontrak final"

    download = client.get(
        f"/api/v1/projects/p1/attachments/files/{file_id}/download",
        headers=auth_headers,
    )
    assert download.status_code == 200
    assert download.data == b"contoh isi kontrak"

    delete_folder = client.delete(
        f"/api/v1/projects/p1/attachments/folders/{root_folder_id}",
        headers=auth_headers,
    )
    assert delete_folder.status_code == 200

    files_after = client.get("/api/v1/projects/p1/attachments/files", headers=auth_headers)
    assert files_after.status_code == 200
    assert files_after.get_json()["data"] == []
