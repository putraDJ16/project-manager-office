import { apiRequest, type Paginated, unwrapListData } from "./apiClient";
import type { CreateIssueInput, Issue, IssueStatus, SlaConfig, SlaRule } from "../domain/issues";

type ApiIssue = {
  id: string;
  project_id: string;
  title: string;
  severity: Issue["severity"];
  status: Issue["status"];
  reporter: string;
  assignee: string | null;
  description: string;
  module: string;
  environment: string;
  reproduction_steps: string[];
  actual_result: string;
  expected_result: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
};

type ApiSlaRule = {
  severity: SlaRule["severity"];
  target_hours: number;
  auto_escalate: boolean;
  escalation_delay_minutes: number;
};

type ApiSlaConfig = {
  rules: ApiSlaRule[];
};

function mapIssueFromApi(source: ApiIssue): Issue {
  return {
    id: source.id,
    projectId: source.project_id,
    title: source.title,
    severity: source.severity,
    status: source.status,
    reporter: source.reporter,
    assignee: source.assignee,
    description: source.description,
    module: source.module,
    environment: source.environment,
    reproductionSteps: source.reproduction_steps ?? [],
    actualResult: source.actual_result,
    expectedResult: source.expected_result,
    attachments: source.attachments ?? [],
    createdAt: source.created_at,
    updatedAt: source.updated_at
  };
}

function mapSlaRuleFromApi(source: ApiSlaRule): SlaRule {
  return {
    severity: source.severity,
    targetHours: source.target_hours,
    autoEscalate: source.auto_escalate,
    escalationDelayMinutes: source.escalation_delay_minutes
  };
}

function mapSlaRuleToApi(source: SlaRule): ApiSlaRule {
  return {
    severity: source.severity,
    target_hours: source.targetHours,
    auto_escalate: source.autoEscalate,
    escalation_delay_minutes: source.escalationDelayMinutes
  };
}

export async function getIssues(projectId?: string): Promise<Issue[]> {
  const query = new URLSearchParams();
  if (projectId) query.set("project_id", projectId);
  const suffix = query.toString();
  const path = suffix ? `/issues?${suffix}` : "/issues";
  const result = await apiRequest<ApiIssue[] | Paginated<ApiIssue>>(path, { method: "GET" });
  return unwrapListData(result.data).map(mapIssueFromApi);
}

export async function createIssue(payload: CreateIssueInput): Promise<Issue> {
  const result = await apiRequest<ApiIssue>("/issues", {
    method: "POST",
    body: {
      project_id: payload.projectId,
      title: payload.title,
      severity: payload.severity,
      reporter: payload.reporter,
      assignee: payload.assignee ?? null,
      description: payload.description ?? "",
      module: payload.module,
      environment: payload.environment,
      reproduction_steps: payload.reproductionSteps,
      actual_result: payload.actualResult,
      expected_result: payload.expectedResult,
      attachments: payload.attachments ?? []
    }
  });
  return mapIssueFromApi(result.data);
}

export async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<Issue> {
  const result = await apiRequest<ApiIssue>(`/issues/${issueId}/status`, {
    method: "PATCH",
    body: { status }
  });
  return mapIssueFromApi(result.data);
}

export async function escalateIssue(issueId: string): Promise<Issue> {
  const result = await apiRequest<ApiIssue>(`/issues/${issueId}/escalate`, { method: "POST" });
  return mapIssueFromApi(result.data);
}

export async function getSlaConfig(): Promise<SlaConfig> {
  const result = await apiRequest<ApiSlaConfig>("/sla-config", { method: "GET" });
  return {
    rules: (result.data.rules ?? []).map(mapSlaRuleFromApi)
  };
}

export async function updateSlaConfig(config: SlaConfig): Promise<SlaConfig> {
  const result = await apiRequest<ApiSlaConfig>("/sla-config", {
    method: "PUT",
    body: {
      rules: config.rules.map(mapSlaRuleToApi)
    }
  });
  return {
    rules: (result.data.rules ?? []).map(mapSlaRuleFromApi)
  };
}
