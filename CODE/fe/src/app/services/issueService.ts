import {
  ISSUE_SEVERITY_ORDER,
  type CreateIssueInput,
  type Issue,
  type IssueSeverity,
  type IssueStatus,
  type SlaConfig,
  type SlaRule
} from "../domain/issues";

const DEFAULT_SLA_RULES: SlaRule[] = [
  { severity: "Blocker", targetHours: 2, autoEscalate: true, escalationDelayMinutes: 15 },
  { severity: "Critical", targetHours: 4, autoEscalate: true, escalationDelayMinutes: 30 },
  { severity: "Major", targetHours: 8, autoEscalate: true, escalationDelayMinutes: 60 },
  { severity: "Minor", targetHours: 24, autoEscalate: false, escalationDelayMinutes: 120 },
  { severity: "Trivial", targetHours: 48, autoEscalate: false, escalationDelayMinutes: 240 }
];

const seedIssues: Issue[] = [
  {
    id: "BUG-201",
    projectId: "p1",
    title: "API Otentikasi Timeout",
    severity: "Blocker",
    status: "Investigating",
    reporter: "Client A",
    assignee: "Dina M.",
    description: "Timeout 504 muncul saat trafik login meningkat drastis.",
    module: "Auth Gateway v2",
    environment: "Production / Win11",
    reproductionSteps: [
      "Buka halaman login sistem",
      "Jalankan load test 1000 req/sec",
      "Kirim request login serentak"
    ],
    actualResult: "Service timeout dan restart otomatis.",
    expectedResult: "Sistem menolak request berlebih secara graceful (429).",
    attachments: ["error-log.png", "network-tab.mp4"],
    createdAt: toIsoFromNow(-100),
    updatedAt: toIsoFromNow(-80)
  },
  {
    id: "BUG-202",
    projectId: "p1",
    title: "Tombol Simpan Freeze",
    severity: "Major",
    status: "Open",
    reporter: "Andi J.",
    assignee: null,
    description: "UI freeze ketika user menekan tombol simpan pada form profil.",
    module: "Profile Form",
    environment: "Staging / Chrome",
    reproductionSteps: ["Buka halaman profil", "Ubah field bio", "Klik tombol simpan"],
    actualResult: "Tombol loading tidak selesai dan UI tidak merespons.",
    expectedResult: "Form tersimpan dan menampilkan notifikasi sukses.",
    attachments: ["freeze-recording.mp4"],
    createdAt: toIsoFromNow(-150),
    updatedAt: toIsoFromNow(-145)
  },
  {
    id: "BUG-203",
    projectId: "p1",
    title: "Salah Ketik di Halaman Login",
    severity: "Trivial",
    status: "In Progress",
    reporter: "Citra W.",
    assignee: "Andi J.",
    description: "Terdapat typo pada label tombol login.",
    module: "Auth UI",
    environment: "Production / Chrome",
    reproductionSteps: ["Buka halaman login", "Perhatikan tombol submit"],
    actualResult: "Label tertulis 'Logn'.",
    expectedResult: "Label tertulis 'Login'.",
    attachments: [],
    createdAt: toIsoFromNow(-60),
    updatedAt: toIsoFromNow(-20)
  },
  {
    id: "BUG-204",
    projectId: "p2",
    title: "Database Deadlock",
    severity: "Critical",
    status: "Escalated",
    reporter: "System",
    assignee: "Budi S.",
    description: "Deadlock terdeteksi pada proses sinkronisasi batch.",
    module: "Billing Sync",
    environment: "Production / Linux",
    reproductionSteps: ["Trigger batch sync", "Jalankan dua worker paralel"],
    actualResult: "Transaksi saling menunggu dan gagal commit.",
    expectedResult: "Transaksi berjalan serial tanpa deadlock.",
    attachments: ["db-trace.log"],
    createdAt: toIsoFromNow(-500),
    updatedAt: toIsoFromNow(-250)
  }
];

let issuesStore: Issue[] = seedIssues.map(cloneIssue);
let slaConfigStore: SlaConfig = { rules: DEFAULT_SLA_RULES.map(cloneRule) };

export async function getIssues(): Promise<Issue[]> {
  return issuesStore.map(cloneIssue);
}

export async function createIssue(payload: CreateIssueInput): Promise<Issue> {
  const now = new Date().toISOString();
  const normalizedReproductionSteps = sanitizeStringList(payload.reproductionSteps);
  const normalizedAttachments = sanitizeStringList(payload.attachments);

  const issue: Issue = {
    id: getNextIssueId(issuesStore),
    projectId: payload.projectId.trim() || "p1",
    title: payload.title.trim(),
    severity: payload.severity,
    status: "Open",
    reporter: payload.reporter.trim(),
    assignee: sanitizeOptionalText(payload.assignee),
    description: payload.description?.trim() || "Belum ada deskripsi tambahan.",
    module: payload.module.trim() || "General",
    environment: payload.environment.trim() || "Unspecified",
    reproductionSteps: normalizedReproductionSteps.length > 0 ? normalizedReproductionSteps : ["Belum diisi"],
    actualResult: payload.actualResult.trim() || "Belum diisi",
    expectedResult: payload.expectedResult.trim() || "Belum diisi",
    attachments: normalizedAttachments,
    createdAt: now,
    updatedAt: now
  };

  issuesStore = [issue, ...issuesStore];
  return cloneIssue(issue);
}

export async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<Issue> {
  const index = issuesStore.findIndex((issue) => issue.id === issueId);
  if (index === -1) {
    throw new Error(`Issue ${issueId} tidak ditemukan.`);
  }

  const current = issuesStore[index];
  const updated: Issue = {
    ...current,
    status,
    updatedAt: new Date().toISOString()
  };

  const nextStore = [...issuesStore];
  nextStore[index] = updated;
  issuesStore = nextStore;

  return cloneIssue(updated);
}

export async function escalateIssue(issueId: string): Promise<Issue> {
  return updateIssueStatus(issueId, "Escalated");
}

export async function getSlaConfig(): Promise<SlaConfig> {
  return {
    rules: slaConfigStore.rules.map(cloneRule)
  };
}

export async function updateSlaConfig(config: SlaConfig): Promise<SlaConfig> {
  const normalized = normalizeSlaConfig(config);
  slaConfigStore = {
    rules: normalized.rules.map(cloneRule)
  };

  return {
    rules: slaConfigStore.rules.map(cloneRule)
  };
}

function normalizeSlaConfig(config: SlaConfig): SlaConfig {
  const incomingBySeverity = config.rules.reduce<Record<IssueSeverity, SlaRule | undefined>>(
    (acc, rule) => {
      acc[rule.severity] = rule;
      return acc;
    },
    {
      Blocker: undefined,
      Critical: undefined,
      Major: undefined,
      Minor: undefined,
      Trivial: undefined
    }
  );

  const rules = ISSUE_SEVERITY_ORDER.map((severity) => {
    const incoming = incomingBySeverity[severity];
    const fallback = DEFAULT_SLA_RULES.find((rule) => rule.severity === severity)!;

    return {
      severity,
      targetHours: sanitizeNumber(incoming?.targetHours, fallback.targetHours, 1, 720),
      autoEscalate: incoming?.autoEscalate ?? fallback.autoEscalate,
      escalationDelayMinutes: sanitizeNumber(
        incoming?.escalationDelayMinutes,
        fallback.escalationDelayMinutes,
        0,
        4320
      )
    };
  });

  return { rules };
}

function sanitizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function sanitizeStringList(values: string[] | undefined) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function sanitizeNumber(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getNextIssueId(issues: Issue[]) {
  const nextValue = issues.reduce((acc, issue) => {
    const match = issue.id.match(/^BUG-(\d+)$/);
    if (!match) return acc;
    const parsed = Number(match[1]);
    if (Number.isNaN(parsed)) return acc;
    return Math.max(acc, parsed);
  }, 200);

  return `BUG-${nextValue + 1}`;
}

function cloneIssue(issue: Issue): Issue {
  return {
    ...issue,
    reproductionSteps: [...issue.reproductionSteps],
    attachments: [...issue.attachments]
  };
}

function cloneRule(rule: SlaRule): SlaRule {
  return {
    ...rule
  };
}

function toIsoFromNow(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60 * 1000).toISOString();
}
