export type MeetingType = "Online" | "Offline";
export type MeetingStatus = "Scheduled" | "In Progress" | "Done" | "Cancelled";
export type RsvpStatus = "Pending" | "Accepted" | "Declined";

export type MeetingAttendee = {
  meeting_id: number;
  employee_id: string;
  employee_name: string | null;
  rsvp_status: RsvpStatus;
  attended: boolean;
};

export type MeetingActionItem = {
  id: number;
  meeting_note_id: number;
  description: string;
  assignee_employee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  is_done: boolean;
  order_index: number;
};

export type MeetingNote = {
  id: number;
  meeting_id: number;
  summary: string | null;
  notes: string | null;
  decisions: string[];
  last_edited_by_name: string | null;
  action_items: MeetingActionItem[];
  created_at: string;
  updated_at: string;
};

export type MeetingFile = {
  id: number;
  meeting_id: number;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  description: string | null;
  uploaded_by: number | null;
  uploader_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Meeting = {
  id: number;
  project_id: string;
  project_name: string | null;
  title: string;
  description: string | null;
  location: string | null;
  meeting_type: MeetingType;
  meeting_url: string | null;
  start_datetime: string;
  end_datetime: string;
  status: MeetingStatus;
  effective_status: MeetingStatus;
  created_by: number | null;
  created_by_name: string | null;
  attendees: MeetingAttendee[];
  attendee_count: number;
  note: MeetingNote | null;
  files: MeetingFile[];
  files_count: number;
  created_at: string;
  updated_at: string;
};

export type MeetingNoteSummary = {
  meeting_id: number;
  title: string;
  start_datetime: string;
  summary: string | null;
  decisions_count: number;
  action_items_open: number;
  action_items_total: number;
  files_count: number;
  last_edited_by: string | null;
  updated_at: string;
};

export type CalendarMeeting = {
  meeting_id: number;
  project_id: string;
  project_name: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  meeting_type: MeetingType;
  meeting_url: string | null;
  status: MeetingStatus;
  my_rsvp: RsvpStatus | null;
};

export function projectCalendarColor(projectId: string) {
  let hash = 0;
  for (const char of projectId) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash}, 70%, 42%)`;
}
