import { apiRequest } from "./apiClient";

export type EmailPreferences = {
  project_assignment: boolean;
  task_assignment: boolean;
  issue_events: boolean;
  meeting_invites: boolean;
  meeting_reminders: boolean;
  action_items: boolean;
};

export async function getEmailPreferences() {
  const response = await apiRequest<EmailPreferences>("/me/email-preferences");
  return response.data;
}

export async function updateEmailPreferences(payload: Partial<EmailPreferences>) {
  const response = await apiRequest<EmailPreferences>("/me/email-preferences", { method: "PUT", body: payload });
  return response.data;
}
