import type { CalendarMeeting, Meeting, MeetingAttendee, RsvpStatus } from "../domain/meetings";
import { apiRequest } from "./apiClient";

export type MeetingPayload = {
  title: string;
  description?: string | null;
  location?: string | null;
  meeting_type: "Online" | "Offline";
  meeting_url?: string | null;
  start_datetime: string;
  end_datetime: string;
  attendee_ids?: string[];
};

type MutationResult<T> = { data: T; message?: string };

export async function fetchMeetings(projectId: string, filters?: { status?: string; start_date?: string; end_date?: string }) {
  const query = new URLSearchParams();
  if (filters?.status && filters.status !== "all") query.set("status", filters.status);
  if (filters?.start_date) query.set("start_date", filters.start_date);
  if (filters?.end_date) query.set("end_date", filters.end_date);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await apiRequest<Meeting[]>(`/projects/${projectId}/meetings${suffix}`, { method: "GET" });
  return result.data;
}

export async function fetchMeeting(projectId: string, meetingId: number) {
  const result = await apiRequest<Meeting>(`/projects/${projectId}/meetings/${meetingId}`, { method: "GET" });
  return result.data;
}

export async function createMeeting(projectId: string, payload: MeetingPayload): Promise<MutationResult<Meeting>> {
  const result = await apiRequest<Meeting>(`/projects/${projectId}/meetings`, { method: "POST", body: payload });
  return { data: result.data, message: result.message };
}

export async function updateMeeting(projectId: string, meetingId: number, payload: Partial<MeetingPayload>): Promise<MutationResult<Meeting>> {
  const result = await apiRequest<Meeting>(`/projects/${projectId}/meetings/${meetingId}`, { method: "PATCH", body: payload });
  return { data: result.data, message: result.message };
}

export async function deleteMeeting(projectId: string, meetingId: number) {
  const result = await apiRequest<null>(`/projects/${projectId}/meetings/${meetingId}`, { method: "DELETE" });
  return { data: result.data, message: result.message };
}

export async function rsvpMeeting(projectId: string, meetingId: number, rsvpStatus: RsvpStatus): Promise<MutationResult<MeetingAttendee>> {
  const result = await apiRequest<MeetingAttendee>(`/projects/${projectId}/meetings/${meetingId}/attendees/rsvp`, {
    method: "PATCH",
    body: { rsvp_status: rsvpStatus }
  });
  return { data: result.data, message: result.message };
}

export async function fetchMyCalendar(params: { start_date: string; end_date: string; project_ids?: string[] }) {
  const query = new URLSearchParams({ start_date: params.start_date, end_date: params.end_date });
  if (params.project_ids && params.project_ids.length > 0) query.set("project_ids", params.project_ids.join(","));
  const result = await apiRequest<CalendarMeeting[]>(`/my-calendar?${query.toString()}`, { method: "GET" });
  return result.data;
}
