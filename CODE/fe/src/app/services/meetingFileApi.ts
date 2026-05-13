import type { MeetingFile } from "../domain/meetings";
import { getAccessToken } from "../data/auth";
import { apiRequest, getApiBaseUrl } from "./apiClient";

type MutationResult<T> = { data: T; message?: string };

export async function fetchMeetingFiles(projectId: string, meetingId: number) {
  const result = await apiRequest<MeetingFile[]>(`/projects/${projectId}/meetings/${meetingId}/files`, { method: "GET" });
  return result.data;
}

export async function uploadMeetingFile(
  projectId: string,
  meetingId: number,
  payload: { file: File; description?: string | null }
): Promise<MutationResult<MeetingFile>> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.description) formData.append("description", payload.description);
  const result = await apiRequest<MeetingFile>(`/projects/${projectId}/meetings/${meetingId}/files`, {
    method: "POST",
    body: formData
  });
  return { data: result.data, message: result.message };
}

export async function deleteMeetingFile(projectId: string, meetingId: number, fileId: number) {
  const result = await apiRequest<null>(`/projects/${projectId}/meetings/${meetingId}/files/${fileId}`, { method: "DELETE" });
  return { data: result.data, message: result.message };
}

export async function downloadMeetingFile(projectId: string, meetingId: number, fileId: number, filename: string) {
  const accessToken = getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/meetings/${meetingId}/files/${fileId}/download`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });
  if (!response.ok) throw new Error("Gagal mengunduh file meeting.");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
