import { apiRequest } from "./apiClient";

export type ApiNotification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  target_url: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

type NotificationListPayload = {
  items: ApiNotification[];
  unread_count: number;
};

export async function fetchNotifications(unreadOnly = false) {
  const query = unreadOnly ? "?unread_only=true" : "";
  const result = await apiRequest<NotificationListPayload>(`/notifications${query}`, { method: "GET" });
  return result.data;
}

export async function markNotificationRead(notificationId: number) {
  const result = await apiRequest<ApiNotification>(`/notifications/${notificationId}/read`, { method: "PATCH" });
  return result.data;
}

export async function markAllNotificationsRead() {
  await apiRequest<null>("/notifications/read-all", { method: "POST" });
}
