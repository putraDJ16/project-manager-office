import { apiRequest } from "./apiClient";

export type ApiAuditTrail = {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_name: string | null;
  action: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  request_query: Record<string, unknown> | null;
  request_body: Record<string, unknown> | string | null;
  note: string | null;
  created_at: string;
};

type AuditTrailListPayload = {
  items: ApiAuditTrail[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

export async function fetchUserAuditTrails(userId: number, perPage = 20) {
  const query = new URLSearchParams({
    page: "1",
    per_page: String(perPage),
    user_id: String(userId),
  });

  const result = await apiRequest<AuditTrailListPayload>(`/audit-trails?${query.toString()}`, {
    method: "GET",
  });
  return result.data.items;
}
