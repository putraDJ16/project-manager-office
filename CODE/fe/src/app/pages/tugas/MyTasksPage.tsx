import { useEffect, useMemo, useState, type ElementType } from "react";
import { AlertTriangle, Bug, Calendar, CheckCircle2, ListTodo } from "lucide-react";
import { teamMembers } from "../../data/mockData";
import { ISSUE_STATUS_ORDER, type Issue, type IssueStatus } from "../../domain/issues";
import { fetchMyProjects, getMe, type MyProjectResponse } from "../../services/authApi";
import { getIssues, updateIssueStatus } from "../../services/issueService";
import { fetchAllTasks, updateTask, type ApiTask } from "../../services/taskApi";

type ProfileIdentity = {
  id: number;
  name: string;
  email: string;
  employee_id: string | null;
  employee_name: string | null;
};

type NoticeState = { type: "success" | "error"; message: string } | null;

export function MyTasksPage() {
  const [profile, setProfile] = useState<ProfileIdentity | null>(null);
  const [projects, setProjects] = useState<MyProjectResponse[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "issues">("tasks");
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const profileData = await getMe();
        const identity: ProfileIdentity = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          employee_id: profileData.employee_id ?? null,
          employee_name: profileData.employee_name ?? null,
        };

        const [projectRows, taskRows, issueRows] = await Promise.all([
          fetchMyProjects(),
          fetchAllTasks(),
          getIssues(),
        ]);
        if (isCancelled) return;

        const assignedTasks = taskRows.filter((task) => isAssignedToProfile(task.assignee, identity));
        setProfile(identity);
        setProjects(projectRows);
        setTasks(assignedTasks);
        setIssues(issueRows.filter((issue) => isAssignedToProfile(issue.assignee, identity)));
        setProgressDrafts(Object.fromEntries(assignedTasks.map((task) => [task.id, String(task.progress_percentage)])));
      } catch (loadError) {
        if (isCancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat tugas saya.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const projectNameById = useMemo(
    () => projects.reduce<Record<string, string>>((acc, project) => ({ ...acc, [project.id]: project.name }), {}),
    [projects]
  );

  const summary = useMemo(
    () => ({
      openTasks: tasks.filter((task) => task.progress_percentage < 100).length,
      doneTasks: tasks.filter((task) => task.progress_percentage >= 100).length,
      openIssues: issues.filter((issue) => issue.status !== "Resolved").length,
      severeIssues: issues.filter((issue) => issue.status !== "Resolved" && ["Blocker", "Critical"].includes(issue.severity)).length,
    }),
    [issues, tasks]
  );

  const handleSaveTaskProgress = async (task: ApiTask) => {
    const rawValue = progressDrafts[task.id] ?? String(task.progress_percentage);
    const progress = Number(rawValue);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setNotice({ type: "error", message: "Progress tugas harus berupa angka 0-100." });
      return;
    }

    setSavingTaskId(task.id);
    try {
      const updated = await updateTask(task.id, { progress_percentage: progress });
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      setProgressDrafts((current) => ({ ...current, [task.id]: String(updated.progress_percentage) }));
      setNotice({ type: "success", message: `Progress ${task.id} berhasil diperbarui.` });
    } catch (updateError) {
      setNotice({
        type: "error",
        message: updateError instanceof Error ? updateError.message : "Gagal memperbarui progress tugas.",
      });
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleIssueStatusChange = async (issue: Issue, status: IssueStatus) => {
    if (issue.status === status) return;
    setSavingIssueId(issue.id);
    try {
      const updated = await updateIssueStatus(issue.id, status);
      setIssues((current) => current.map((item) => (item.id === issue.id ? updated : item)));
      setNotice({ type: "success", message: `Status ${issue.id} berhasil diperbarui.` });
    } catch (updateError) {
      setNotice({
        type: "error",
        message: updateError instanceof Error ? updateError.message : "Gagal memperbarui status isu.",
      });
    } finally {
      setSavingIssueId(null);
    }
  };

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center text-sm text-slate-500 mb-1">
          <span>Manajemen Tugas</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-700">Tugas Saya</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tugas Saya</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tugas dan isu/bug yang diassign ke {profile?.employee_name ?? profile?.name ?? "akun Anda"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <SummaryBadge icon={ListTodo} label={`${summary.openTasks} tugas aktif`} tone="indigo" />
            <SummaryBadge icon={CheckCircle2} label={`${summary.doneTasks} tugas selesai`} tone="emerald" />
            <SummaryBadge icon={Bug} label={`${summary.openIssues} isu aktif`} tone="red" />
            <SummaryBadge icon={AlertTriangle} label={`${summary.severeIssues} high risk`} tone="amber" />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="grid w-full grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-96">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "tasks" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            Tugas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("issues")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "issues" ? "bg-slate-100 text-red-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bug className="h-4 w-4" />
            Isu & Bug
          </button>
        </div>
      </div>

      <div className="p-6">
        {notice && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Memuat tugas saya...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : activeTab === "tasks" ? (
          <TaskTable
            tasks={tasks}
            projectNameById={projectNameById}
            progressDrafts={progressDrafts}
            savingTaskId={savingTaskId}
            onProgressChange={(taskId, value) => setProgressDrafts((current) => ({ ...current, [taskId]: value }))}
            onSaveProgress={handleSaveTaskProgress}
          />
        ) : (
          <IssueTable
            issues={issues}
            projectNameById={projectNameById}
            savingIssueId={savingIssueId}
            onStatusChange={handleIssueStatusChange}
          />
        )}
      </div>
    </div>
  );
}

function TaskTable({
  tasks,
  projectNameById,
  progressDrafts,
  savingTaskId,
  onProgressChange,
  onSaveProgress,
}: {
  tasks: ApiTask[];
  projectNameById: Record<string, string>;
  progressDrafts: Record<string, string>;
  savingTaskId: string | null;
  onProgressChange: (taskId: string, value: string) => void;
  onSaveProgress: (task: ApiTask) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Belum ada tugas yang diassign ke akun Anda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Judul</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Prioritas</th>
            <th className="px-4 py-3 font-medium">Periode</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id} className="bg-white align-middle">
              <td className="px-4 py-3 font-medium text-slate-500">{task.id}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">Assignee: {resolveAssigneeDisplay(task.assignee)}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{projectNameById[task.project_id] ?? task.project_id}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(task.start_date)} - {formatDate(task.end_date)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex min-w-44 items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(100, Math.max(0, task.progress_percentage))}%` }}
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={progressDrafts[task.id] ?? String(task.progress_percentage)}
                    onChange={(event) => onProgressChange(task.id, event.target.value)}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label={`Progress ${task.title}`}
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSaveProgress(task)}
                  disabled={savingTaskId === task.id}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savingTaskId === task.id ? "Menyimpan..." : "Simpan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueTable({
  issues,
  projectNameById,
  savingIssueId,
  onStatusChange,
}: {
  issues: Issue[];
  projectNameById: Record<string, string>;
  savingIssueId: string | null;
  onStatusChange: (issue: Issue, status: IssueStatus) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Belum ada isu atau bug yang diassign ke akun Anda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">ID Bug</th>
            <th className="px-4 py-3 font-medium">Judul Isu</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Diperbarui</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {issues.map((issue) => (
            <tr key={issue.id} className="bg-white align-middle">
              <td className="px-4 py-3 font-bold text-slate-500">{issue.id}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{issue.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">Module: {displayValue(issue.module)}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{projectNameById[issue.projectId] ?? issue.projectId}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${severityColor(issue.severity)}`}>
                  {issue.severity}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={issue.status}
                  onChange={(event) => onStatusChange(issue, event.target.value as IssueStatus)}
                  disabled={savingIssueId === issue.id}
                  className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${issueStatusColor(issue.status)}`}
                >
                  {ISSUE_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-slate-700">{formatDateTime(issue.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBadge({
  icon: Icon,
  label,
  tone,
}: {
  icon: ElementType;
  label: string;
  tone: "indigo" | "emerald" | "red" | "amber";
}) {
  const styles: Record<typeof tone, string> = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium ${styles[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function normalizeAssignee(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function abbreviatedName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0]}.`;
}

function buildProfileAssigneeAliases(profile: ProfileIdentity) {
  const rawAliases = [
    profile.id,
    profile.name,
    profile.email,
    profile.employee_id,
    profile.employee_name,
    abbreviatedName(profile.name),
    abbreviatedName(profile.employee_name),
  ];

  const aliases = new Set(rawAliases.map(normalizeAssignee).filter(Boolean));
  teamMembers.forEach((member) => {
    if (aliases.has(normalizeAssignee(member.name))) {
      aliases.add(normalizeAssignee(member.id));
    }
  });
  return aliases;
}

function isAssignedToProfile(assignee: string | null | undefined, profile: ProfileIdentity) {
  const normalizedAssignee = normalizeAssignee(assignee);
  if (!normalizedAssignee) return false;
  return buildProfileAssigneeAliases(profile).has(normalizedAssignee);
}

function resolveAssigneeDisplay(assignee: string) {
  return teamMembers.find((member) => member.id === assignee)?.name ?? assignee;
}

function displayValue(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityColor(priority: string | null) {
  if (priority === "Critical") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "High") return "bg-orange-50 text-orange-700 border-orange-200";
  if (priority === "Medium") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (priority === "Low") return "bg-green-50 text-green-700 border-green-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function severityColor(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-red-900 text-red-50 border-red-950",
    Critical: "bg-red-50 text-red-700 border-red-200",
    Major: "bg-orange-50 text-orange-700 border-orange-200",
    Minor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    Trivial: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return styles[severity];
}

function issueStatusColor(status: Issue["status"]) {
  const styles: Record<Issue["status"], string> = {
    Open: "bg-slate-50 text-slate-700 border-slate-200",
    Investigating: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Escalated: "bg-red-50 text-red-700 border-red-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return styles[status];
}
