import { apiRequest, type Paginated } from "./apiClient";

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

export type AuditTrailListParams = {
  cursorUrl?: string;
  perPage?: number;
  userId?: number;
  method?: string;
  path?: string;
  statusCode?: number;
  q?: string;
};

function buildAuditTrailPath(params: AuditTrailListParams = {}) {
  if (params.cursorUrl) {
    return params.cursorUrl;
  }

  const query = new URLSearchParams();
  query.set("per_page", String(params.perPage ?? 20));
  if (params.userId !== undefined) query.set("user_id", String(params.userId));
  if (params.method) query.set("method", params.method);
  if (params.path) query.set("path", params.path);
  if (params.statusCode !== undefined) query.set("status_code", String(params.statusCode));
  if (params.q) query.set("q", params.q);

  return `/audit-trails?${query.toString()}`;
}

export async function fetchUserAuditTrails(params: AuditTrailListParams): Promise<Paginated<ApiAuditTrail>> {
  const result = await apiRequest<Paginated<ApiAuditTrail>>(buildAuditTrailPath(params), {
    method: "GET",
  });
  return result.data;
}
