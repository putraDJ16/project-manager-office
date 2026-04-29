import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  ShieldAlert,
  Target,
  TrendingUp
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { fetchProjects, type ApiProject } from "../services/projectApi";
import { fetchAllTasks, type ApiTask } from "../services/taskApi";
import { getIssues } from "../services/issueService";
import type { Issue } from "../domain/issues";

type StatTone = "blue" | "emerald" | "amber" | "rose";

const RISK_SEVERITIES = new Set<Issue["severity"]>(["Blocker", "Critical"]);

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isTaskOpen(task: ApiTask) {
  return task.progress_percentage < 100;
}

function isTaskOverdue(task: ApiTask, today = startOfToday()) {
  if (!task.end_date || !isTaskOpen(task)) return false;
  return new Date(task.end_date) < today;
}

function isTaskNearTimeline(task: ApiTask, today = startOfToday()) {
  if (!task.end_date || !isTaskOpen(task)) return false;
  const due = new Date(task.end_date);
  return due >= today && due <= addDays(today, 7);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(value: Date) {
  return value.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

function buildProjectMonthlyData(projects: ApiProject[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: monthLabel(date),
      total: 0,
      active: 0,
      completed: 0
    };
  });

  projects.forEach((project) => {
    const created = new Date(project.created_at);
    if (Number.isNaN(created.getTime())) return;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((item) => item.key === key);
    if (!bucket) return;
    bucket.total += 1;
    if (project.status === "Completed") bucket.completed += 1;
    if (project.status !== "Completed") bucket.active += 1;
  });

  return months;
}

function projectTaskProgress(projectId: string, tasks: ApiTask[]) {
  const projectTasks = tasks.filter((task) => task.project_id === projectId);
  if (projectTasks.length === 0) return 0;
  return Math.round(projectTasks.reduce((sum, task) => sum + task.progress_percentage, 0) / projectTasks.length);
}

function projectOpenIssues(projectId: string, issues: Issue[]) {
  return issues.filter((issue) => issue.projectId === projectId && issue.status !== "Resolved").length;
}

export function HomeDashboard() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [projectRows, taskRows, issueRows] = await Promise.all([
          fetchProjects(),
          fetchAllTasks(),
          getIssues()
        ]);
        if (isCancelled) return;
        setProjects(projectRows);
        setTasks(taskRows);
        setIssues(issueRows);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data beranda.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, []);

  const today = useMemo(() => startOfToday(), []);
  const activeProjects = useMemo(() => projects.filter((project) => project.status !== "Completed"), [projects]);
  const openTasks = useMemo(() => tasks.filter(isTaskOpen), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter((task) => isTaskOverdue(task, today)), [tasks, today]);
  const nearTimelineTasks = useMemo(
    () =>
      tasks
        .filter((task) => isTaskNearTimeline(task, today))
        .sort((left, right) => new Date(left.end_date ?? "").getTime() - new Date(right.end_date ?? "").getTime())
        .slice(0, 6),
    [tasks, today]
  );
  const riskIssues = useMemo(
    () => issues.filter((issue) => issue.status !== "Resolved" && RISK_SEVERITIES.has(issue.severity)),
    [issues]
  );
  const riskItems = riskIssues.length + overdueTasks.length;
  const onTimeRate = useMemo(() => {
    const scheduled = tasks.filter((task) => Boolean(task.end_date));
    if (scheduled.length === 0) return 100;
    const onTrack = scheduled.filter((task) => !isTaskOverdue(task, today)).length;
    return Math.round((onTrack / scheduled.length) * 100);
  }, [tasks, today]);
  const projectMonthlyData = useMemo(() => buildProjectMonthlyData(projects), [projects]);
  const projectById = useMemo(
    () => projects.reduce<Record<string, ApiProject>>((acc, project) => ({ ...acc, [project.id]: project }), {}),
    [projects]
  );
  const activeProjectRows = useMemo(
    () =>
      activeProjects
        .map((project) => ({
          project,
          progress: projectTaskProgress(project.id, tasks),
          openTasks: tasks.filter((task) => task.project_id === project.id && isTaskOpen(task)).length,
          openIssues: projectOpenIssues(project.id, issues)
        }))
        .sort((left, right) => right.openIssues - left.openIssues || right.openTasks - left.openTasks)
        .slice(0, 5),
    [activeProjects, issues, tasks]
  );
  const topRiskRows = useMemo(() => {
    const issueRows = riskIssues.slice(0, 4).map((issue) => ({
      id: issue.id,
      title: issue.title,
      context: projectById[issue.projectId]?.name ?? issue.projectId,
      label: issue.severity,
      tone: "rose" as StatTone,
      due: issue.status
    }));
    const taskRows = overdueTasks.slice(0, 4).map((task) => ({
      id: task.id,
      title: task.title,
      context: projectById[task.project_id]?.name ?? task.project_id,
      label: task.priority,
      tone: "amber" as StatTone,
      due: `Overdue ${formatDate(task.end_date)}`
    }));
    return [...issueRows, ...taskRows].slice(0, 6);
  }, [overdueTasks, projectById, riskIssues]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beranda Operasional</h1>
          <p className="text-slate-500 mt-1">
            Ringkasan project, task, timeline, dan risiko dari data terbaru aplikasi.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {isLoading ? "Memuat data..." : `${projects.length} project | ${tasks.length} task | ${issues.length} issue`}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="Proyek Aktif" value={activeProjects.length} icon={FolderKanban} tone="blue" detail={`${projects.length} total project`} />
        <StatCard label="Task Open" value={openTasks.length} icon={CheckCircle2} tone="emerald" detail={`${overdueTasks.length} overdue`} />
        <StatCard label="On Time Rate" value={`${onTimeRate}%`} icon={Target} tone="amber" detail="Berdasarkan deadline task" />
        <StatCard label="Risk Item" value={riskItems} icon={ShieldAlert} tone="rose" detail={`${riskIssues.length} issue kritis`} />
        <StatCard label="Timeline Dekat" value={nearTimelineTasks.length} icon={CalendarClock} tone="blue" detail="Jatuh tempo <= 7 hari" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Project Per Bulan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Jumlah project dibuat dalam 6 bulan terakhir.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectMonthlyData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px rgb(15 23 42 / 0.08)" }}
                  itemStyle={{ fontSize: "13px", fontWeight: 500 }}
                  labelStyle={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}
                />
                <Bar dataKey="active" stackId="project" name="Aktif" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" stackId="project" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Proyek Aktif</h2>
            <Link to="/proyek/list" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-4">
            {activeProjectRows.map(({ project, progress, openTasks: taskCount, openIssues }) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/proyek/${project.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-700 truncate block">
                      {project.name}
                    </Link>
                    <p className="text-xs text-slate-500">{taskCount} task open | {openIssues} issue aktif</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
            {activeProjectRows.length === 0 && (
              <p className="text-sm text-slate-500">Belum ada project aktif.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Task Mendekati Timeline</h2>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Task</th>
                <th className="px-4 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Progress</th>
                <th className="px-4 py-3 text-right font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nearTimelineTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.id} | {task.priority}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{projectById[task.project_id]?.name ?? task.project_id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                      {task.progress_percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatDate(task.end_date)}</td>
                </tr>
              ))}
              {nearTimelineTasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    Tidak ada task yang mendekati deadline minggu ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Risk Item</h2>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="divide-y divide-slate-100">
            {topRiskRows.map((item) => (
              <div key={`${item.id}-${item.title}`} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.id} | {item.context}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${
                      item.tone === "rose" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.label}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{item.due}</p>
                </div>
              </div>
            ))}
            {topRiskRows.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Tidak ada risk item aktif.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  detail
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: StatTone;
  detail: string;
}) {
  const styles: Record<StatTone, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-red-50 text-red-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{detail}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
