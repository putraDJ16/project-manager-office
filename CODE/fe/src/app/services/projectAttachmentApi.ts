import { apiRequest } from "./apiClient";
import { getAccessToken } from "../data/auth";

export type ApiAttachmentFolder = {
  id: string;
  project_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiAttachmentFile = {
  id: string;
  project_id: string;
  folder_id: string | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

type MutationResult<T> = { data: T; message?: string };

export async function fetchAttachmentFolders(projectId: string) {
  const result = await apiRequest<ApiAttachmentFolder[]>(`/projects/${projectId}/attachments/folders`, {
    method: "GET"
  });
  return result.data;
}

export async function createAttachmentFolder(
  projectId: string,
  payload: { name: string; parent_id?: string | null }
): Promise<MutationResult<ApiAttachmentFolder>> {
  const result = await apiRequest<ApiAttachmentFolder>(`/projects/${projectId}/attachments/folders`, {
    method: "POST",
    body: payload
  });
  return { data: result.data, message: result.message };
}

export async function updateAttachmentFolder(
  projectId: string,
  folderId: string,
  payload: { name?: string; parent_id?: string | null }
): Promise<MutationResult<ApiAttachmentFolder>> {
  const result = await apiRequest<ApiAttachmentFolder>(
    `/projects/${projectId}/attachments/folders/${folderId}`,
    {
      method: "PATCH",
      body: payload
    }
  );
  return { data: result.data, message: result.message };
}

export async function deleteAttachmentFolder(projectId: string, folderId: string) {
  const result = await apiRequest<null>(`/projects/${projectId}/attachments/folders/${folderId}`, {
    method: "DELETE"
  });
  return { data: result.data, message: result.message };
}

export async function fetchAttachmentFiles(projectId: string, folderId?: string | null) {
  const query = new URLSearchParams();
  if (folderId) query.set("folder_id", folderId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<ApiAttachmentFile[]>(
    `/projects/${projectId}/attachments/files${suffix}`,
    { method: "GET" }
  );
  return result.data;
}

export async function uploadAttachmentFile(
  projectId: string,
  payload: { file: File; folder_id?: string | null; description?: string | null }
): Promise<MutationResult<ApiAttachmentFile>> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.folder_id) formData.append("folder_id", payload.folder_id);
  if (payload.description) formData.append("description", payload.description);

  const result = await apiRequest<ApiAttachmentFile>(`/projects/${projectId}/attachments/files`, {
    method: "POST",
    body: formData
  });
  return { data: result.data, message: result.message };
}

export async function updateAttachmentFile(
  projectId: string,
  fileId: string,
  payload: { description?: string | null; folder_id?: string | null }
): Promise<MutationResult<ApiAttachmentFile>> {
  const result = await apiRequest<ApiAttachmentFile>(`/projects/${projectId}/attachments/files/${fileId}`, {
    method: "PATCH",
    body: payload
  });
  return { data: result.data, message: result.message };
}

export async function deleteAttachmentFile(projectId: string, fileId: string) {
  const result = await apiRequest<null>(`/projects/${projectId}/attachments/files/${fileId}`, {
    method: "DELETE"
  });
  return { data: result.data, message: result.message };
}

export async function downloadAttachmentFile(projectId: string, fileId: string, filename: string) {
  const blob = await fetchAttachmentFileBlob(projectId, fileId);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAttachmentFileBlob(projectId: string, fileId: string) {
  const accessToken = getAccessToken();
  const response = await fetch(`/api/v1/projects/${projectId}/attachments/files/${fileId}/download`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
  if (!response.ok) {
    throw new Error("Gagal mengambil file lampiran.");
  }
  return response.blob();
}
