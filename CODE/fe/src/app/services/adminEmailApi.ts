import { apiRequest } from "./apiClient";

export type EmailOutboxItem = {
  id: number;
  to_email: string;
  event_key: string;
  entity_type: string | null;
  subject: string;
  status: "Queued" | "Sending" | "Sent" | "Failed";
  attempts: number;
  last_error: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string | null;
};

export async function listEmailOutbox(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiRequest<{ items: EmailOutboxItem[]; total: number }>(`/admin/email-outbox${query}`);
  return response.data;
}

export async function resendEmail(id: number) {
  const response = await apiRequest<EmailOutboxItem>(`/admin/email-outbox/${id}/resend`, { method: "POST" });
  return response.data;
}
