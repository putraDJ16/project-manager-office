export const ISSUE_STATUS_ORDER = [
  "Open",
  "Investigating",
  "In Progress",
  "Escalated",
  "Resolved"
] as const;

export const ISSUE_SEVERITY_ORDER = [
  "Blocker",
  "Critical",
  "Major",
  "Minor",
  "Trivial"
] as const;

export type IssueStatus = (typeof ISSUE_STATUS_ORDER)[number];
export type IssueSeverity = (typeof ISSUE_SEVERITY_ORDER)[number];

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reporter: string;
  assignee: string | null;
  description: string;
  module: string;
  environment: string;
  reproductionSteps: string[];
  actualResult: string;
  expectedResult: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateIssueInput = {
  projectId: string;
  title: string;
  severity: IssueSeverity;
  reporter: string;
  assignee?: string | null;
  description?: string;
  module: string;
  environment: string;
  reproductionSteps: string[];
  actualResult: string;
  expectedResult: string;
  attachments?: string[];
};

export type SlaRule = {
  severity: IssueSeverity;
  targetHours: number;
  autoEscalate: boolean;
  escalationDelayMinutes: number;
};

export type SlaConfig = {
  rules: SlaRule[];
};
