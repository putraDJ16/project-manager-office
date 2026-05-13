import type { MeetingActionItem, MeetingNote, MeetingNoteSummary } from "../domain/meetings";
import { apiRequest } from "./apiClient";

export type MeetingNotePayload = {
  summary?: string | null;
  notes?: string | null;
  decisions?: string[];
  action_items?: Array<{
    description: string;
    assignee_employee_id?: string | null;
    due_date?: string | null;
    is_done?: boolean;
  }>;
};

type MutationResult<T> = { data: T; message?: string };

export async function fetchMeetingNote(projectId: string, meetingId: number) {
  const result = await apiRequest<MeetingNote | null>(`/projects/${projectId}/meetings/${meetingId}/note`, { method: "GET" });
  return result.data;
}

export async function upsertMeetingNote(projectId: string, meetingId: number, payload: MeetingNotePayload): Promise<MutationResult<MeetingNote>> {
  const result = await apiRequest<MeetingNote>(`/projects/${projectId}/meetings/${meetingId}/note`, { method: "PUT", body: payload });
  return { data: result.data, message: result.message };
}

export async function updateMeetingActionItem(
  projectId: string,
  meetingId: number,
  itemId: number,
  payload: Partial<Pick<MeetingActionItem, "description" | "assignee_employee_id" | "due_date" | "is_done" | "order_index">>
) {
  const result = await apiRequest<MeetingActionItem>(
    `/projects/${projectId}/meetings/${meetingId}/note/action-items/${itemId}`,
    { method: "PATCH", body: payload }
  );
  return { data: result.data, message: result.message };
}

export async function fetchProjectMeetingNotes(
  projectId: string,
  filters?: { search?: string; start_date?: string; end_date?: string; has_open_action?: boolean }
) {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  if (filters?.has_open_action) query.set("has_open_action", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<MeetingNoteSummary[]>(`/projects/${projectId}/meeting-notes${suffix}`, { method: "GET" });
  return result.data;
}
