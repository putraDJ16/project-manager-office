import { useEffect, useMemo, useState, type ElementType } from "react";
import { useSearchParams } from "react-router";
import { AlertTriangle, Briefcase, Bug, Calendar, CalendarDays, CheckCircle2, ListTodo, Loader2, X } from "lucide-react";
import { teamMembers } from "../../data/mockData";
import type { Employee } from "../../data/masterData";
import { fetchEmployees } from "../../services/masterApi";
import { ISSUE_STATUS_ORDER, type Issue, type IssueStatus } from "../../domain/issues";
import { fetchMyProjects, getMe, type MyProjectResponse } from "../../services/authApi";
import { getIssues, updateIssueStatus } from "../../services/issueService";
import {
  createTask,
  createTaskChecklistItem,
  createTaskComment,
  deleteTaskChecklistItem,
  fetchAllTasks,
  fetchPhases,
  fetchTasks,
  fetchTaskChecklist,
  fetchTaskComments,
  updateTask,
  updateTaskChecklistItem,
  type ApiTask,
  type ApiTaskChecklistItem,
  type ApiTaskComment,
  type ApiPhase
} from "../../services/taskApi";
import { createMyTimesheet, deleteMyTimesheet, fetchMyTimesheets, updateMyTimesheet, type ApiTimesheet } from "../../services/timesheetApi";
import { PaginationControls } from "../../components/ui";
import { MyCalendarPage } from "../kalender/MyCalendarPage";
import { TaskDetailModal } from "./TaskDetailModal";

type ProfileIdentity = {
  id: number;
  name: string;
  email: string;
  employee_id: string | null;
  employee_name: string | null;
};

type NoticeState = { type: "success" | "error"; message: string } | null;
type TaskComment = { id: number; authorName: string; content: string; createdAt: string };
type TaskChecklistItem = { id: number; title: string; isDone: boolean };
type TaskCompletionFilter = "active" | "done" | "all";
type MyTasksTab = "tasks" | "issues" | "projects" | "timesheets" | "calendar";

const MY_TASKS_TABS = new Set<MyTasksTab>(["tasks", "issues", "projects", "timesheets", "calendar"]);
const PAGE_SIZE = 10;

function getTabFromSearch(searchParams: URLSearchParams): MyTasksTab {
  const tab = searchParams.get("tab");
  return tab && MY_TASKS_TABS.has(tab as MyTasksTab) ? (tab as MyTasksTab) : "tasks";
}

function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTaskComment(raw: ApiTaskComment): TaskComment {
  return {
    id: raw.id,
    authorName: raw.author_name,
    content: raw.content,
    createdAt: raw.created_at
  };
}

function toTaskChecklistItem(raw: ApiTaskChecklistItem): TaskChecklistItem {
  return {
    id: raw.id,
    title: raw.title,
    isDone: raw.is_done
  };
}

export function MyTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<ProfileIdentity | null>(null);
  const [projects, setProjects] = useState<MyProjectResponse[]>([]);
  const [memberProjects, setMemberProjects] = useState<MyProjectResponse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeTab, setActiveTab] = useState<MyTasksTab>(() => getTabFromSearch(searchParams));
  const [taskFilter, setTaskFilter] = useState<TaskCompletionFilter>("active");
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [taskChecklistItems, setTaskChecklistItems] = useState<Record<string, TaskChecklistItem[]>>({});
  const [isLoadingTaskComments, setIsLoadingTaskComments] = useState(false);
  const [isSavingTaskComment, setIsSavingTaskComment] = useState(false);
  const [isLoadingTaskChecklist, setIsLoadingTaskChecklist] = useState(false);
  const [isSavingTaskChecklist, setIsSavingTaskChecklist] = useState(false);
  const [timesheets, setTimesheets] = useState<ApiTimesheet[]>([]);
  const [timesheetForm, setTimesheetForm] = useState({
    project_id: "",
    task_id: "",
    work_date: toLocalDateKey(),
    hours_spent: "1",
    notes: "",
  });
  const [isSavingTimesheet, setIsSavingTimesheet] = useState(false);
  const [editingTimesheetId, setEditingTimesheetId] = useState<number | null>(null);
  const [deletingTimesheetId, setDeletingTimesheetId] = useState<number | null>(null);
  const [timesheetTaskOptions, setTimesheetTaskOptions] = useState<ApiTask[]>([]);
  const [isLoadingTimesheetTasks, setIsLoadingTimesheetTasks] = useState(false);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState({
    project_id: "",
    phase_id: "",
    assignee: "",
    title: "",
    priority: "Medium" as ApiTask["priority"],
    start_date: "",
    end_date: ""
  });
  const [createTaskPhaseOptions, setCreateTaskPhaseOptions] = useState<ApiPhase[]>([]);
  const [isLoadingCreateTaskPhases, setIsLoadingCreateTaskPhases] = useState(false);
  const [isSavingCreateTask, setIsSavingCreateTask] = useState(false);
  const [taskPage, setTaskPage] = useState(1);
  const [issuePage, setIssuePage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [timesheetPage, setTimesheetPage] = useState(1);

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

        const [projectRows, memberProjectRows, taskRows, issueRows, employeeRows] = await Promise.all([
          fetchMyProjects(),
          fetchMyProjects({ member_only: true }),
          fetchAllTasks(),
          getIssues(),
          fetchEmployees(),
        ]);
        if (isCancelled) return;

        const assignedTasks = taskRows.filter((task) => isAssignedToProfile(task.assignee, identity));
        setProfile(identity);
        setProjects(projectRows);
        setMemberProjects(memberProjectRows);
        setEmployees(employeeRows.filter((employee) => employee.status === "Active"));
        setTasks(assignedTasks);
        setIssues(issueRows.filter((issue) => isAssignedToProfile(issue.assignee, identity)));
        const myTimesheetRows = await fetchMyTimesheets();
        if (isCancelled) return;
        setTimesheets(myTimesheetRows);
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
    const tab = getTabFromSearch(searchParams);
    setActiveTab(tab);
    if (searchParams.get("create") === "task") {
      setIsCreateTaskModalOpen(true);
    }
    if (searchParams.get("create") === "timesheet") {
      setEditingTimesheetId(null);
      setTimesheetForm((current) => ({
        ...current,
        task_id: "",
        work_date: toLocalDateKey(),
        hours_spent: "1",
        notes: ""
      }));
      setIsTimesheetModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isCreateTaskModalOpen) return;
    setCreateTaskForm((current) => ({
      ...current,
      project_id: current.project_id || projects[0]?.id || "",
      assignee: current.assignee || profile?.employee_id || employees[0]?.id || ""
    }));
  }, [employees, isCreateTaskModalOpen, profile?.employee_id, projects]);

  useEffect(() => {
    if (!isTimesheetModalOpen || editingTimesheetId) return;
    setTimesheetForm((current) => ({
      ...current,
      project_id: current.project_id || memberProjects[0]?.id || "",
      work_date: toLocalDateKey()
    }));
  }, [editingTimesheetId, isTimesheetModalOpen, memberProjects]);

  useEffect(() => {
    if (!createTaskForm.project_id) {
      setCreateTaskPhaseOptions([]);
      setCreateTaskForm((current) => ({ ...current, phase_id: "" }));
      return;
    }

    let isCancelled = false;
    setIsLoadingCreateTaskPhases(true);
    fetchPhases(createTaskForm.project_id)
      .then((phaseRows) => {
        if (isCancelled) return;
        const sortedPhases = [...phaseRows].sort((left, right) => left.order_index - right.order_index);
        setCreateTaskPhaseOptions(sortedPhases);
        setCreateTaskForm((current) => ({
          ...current,
          phase_id: sortedPhases.some((phase) => phase.id === current.phase_id) ? current.phase_id : sortedPhases[0]?.id ?? ""
        }));
      })
      .catch((phaseError) => {
        if (isCancelled) return;
        setCreateTaskPhaseOptions([]);
        setNotice({
          type: "error",
          message: phaseError instanceof Error ? phaseError.message : "Gagal memuat fase project."
        });
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingCreateTaskPhases(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [createTaskForm.project_id]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const openCreateTimesheetModal = () => {
    setEditingTimesheetId(null);
    setTimesheetForm((current) => ({
      project_id: current.project_id || memberProjects[0]?.id || "",
      task_id: "",
      work_date: toLocalDateKey(),
      hours_spent: "1",
      notes: ""
    }));
    setIsTimesheetModalOpen(true);
  };

  const openEditTimesheetModal = (timesheet: ApiTimesheet) => {
    setEditingTimesheetId(timesheet.id);
    setTimesheetForm({
      project_id: timesheet.project_id ?? "",
      task_id: timesheet.task_id ?? "",
      work_date: timesheet.work_date,
      hours_spent: String(timesheet.hours_spent),
      notes: timesheet.notes ?? ""
    });
    setIsTimesheetModalOpen(true);
  };

  const closeTimesheetModal = () => {
    if (isSavingTimesheet) return;
    setIsTimesheetModalOpen(false);
    setEditingTimesheetId(null);
    if (searchParams.get("create") === "timesheet") {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete("create");
      setSearchParams(nextSearchParams, { replace: true });
    }
  };

  const projectNameById = useMemo(
    () => projects.reduce<Record<string, string>>((acc, project) => ({ ...acc, [project.id]: project.name }), {}),
    [projects]
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const summary = useMemo(
    () => ({
      openTasks: tasks.filter((task) => task.progress_percentage < 100).length,
      doneTasks: tasks.filter((task) => task.progress_percentage >= 100).length,
      openIssues: issues.filter((issue) => issue.status !== "Resolved").length,
      severeIssues: issues.filter((issue) => issue.status !== "Resolved" && ["Blocker", "Critical"].includes(issue.severity)).length,
      myProjects: projects.length,
    }),
    [issues, projects.length, tasks]
  );

  const filteredTasks = useMemo(() => {
    if (taskFilter === "done") return tasks.filter((task) => task.progress_percentage >= 100);
    if (taskFilter === "all") return tasks;
    return tasks.filter((task) => task.progress_percentage < 100);
  }, [taskFilter, tasks]);
  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, taskPage]);
  const paginatedIssues = useMemo(() => {
    const start = (issuePage - 1) * PAGE_SIZE;
    return issues.slice(start, start + PAGE_SIZE);
  }, [issues, issuePage]);
  const paginatedProjects = useMemo(() => {
    const start = (projectPage - 1) * PAGE_SIZE;
    return projects.slice(start, start + PAGE_SIZE);
  }, [projectPage, projects]);
  const paginatedTimesheets = useMemo(() => {
    const start = (timesheetPage - 1) * PAGE_SIZE;
    return timesheets.slice(start, start + PAGE_SIZE);
  }, [timesheetPage, timesheets]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskFilter, tasks.length]);
  useEffect(() => {
    setIssuePage(1);
  }, [issues.length]);
  useEffect(() => {
    setProjectPage(1);
  }, [projects.length]);
  useEffect(() => {
    setTimesheetPage(1);
  }, [timesheets.length]);

  useEffect(() => {
    if (!timesheetForm.project_id) {
      setTimesheetTaskOptions([]);
      return;
    }
    let isCancelled = false;
    setIsLoadingTimesheetTasks(true);
    fetchTasks(timesheetForm.project_id, "")
      .then((rows) => {
        if (!isCancelled) setTimesheetTaskOptions(rows);
      })
      .catch(() => {
        if (!isCancelled) setTimesheetTaskOptions([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingTimesheetTasks(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [timesheetForm.project_id]);

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
      setNotice({
        type: "success",
        message:
          updated.progress_percentage >= 100
            ? `Progress ${task.id} sudah 100%. Tugas dipindahkan ke filter Selesai.`
            : `Progress ${task.id} berhasil diperbarui.`
      });
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

  const loadTaskComments = async (taskId: string) => {
    setIsLoadingTaskComments(true);
    try {
      const rows = await fetchTaskComments(taskId);
      setTaskComments((current) => ({ ...current, [taskId]: rows.map(toTaskComment) }));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Gagal memuat komentar tugas.";
      if (message.toLowerCase().includes("izin")) {
        setTaskComments((current) => ({ ...current, [taskId]: [] }));
        return;
      }
      setNotice({
        type: "error",
        message
      });
    } finally {
      setIsLoadingTaskComments(false);
    }
  };

  const loadTaskChecklist = async (taskId: string) => {
    setIsLoadingTaskChecklist(true);
    try {
      const rows = await fetchTaskChecklist(taskId);
      setTaskChecklistItems((current) => ({ ...current, [taskId]: rows.map(toTaskChecklistItem) }));
    } catch (loadError) {
      setNotice({
        type: "error",
        message: loadError instanceof Error ? loadError.message : "Gagal memuat checklist tugas."
      });
    } finally {
      setIsLoadingTaskChecklist(false);
    }
  };

  const handleOpenTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    await Promise.all([loadTaskComments(taskId), loadTaskChecklist(taskId)]);
  };

  const handleSubmitTaskComment = async (content: string) => {
    if (!selectedTaskId) return;
    setIsSavingTaskComment(true);
    try {
      await createTaskComment(selectedTaskId, { content });
      await loadTaskComments(selectedTaskId);
      setNotice({ type: "success", message: "Komentar berhasil ditambahkan." });
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal menambahkan komentar tugas."
      });
      throw saveError;
    } finally {
      setIsSavingTaskComment(false);
    }
  };

  const handleAddTaskChecklistItem = async (title: string) => {
    if (!selectedTaskId) return;
    setIsSavingTaskChecklist(true);
    try {
      await createTaskChecklistItem(selectedTaskId, { title });
      await loadTaskChecklist(selectedTaskId);
      setNotice({ type: "success", message: "Checklist berhasil ditambahkan." });
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal menambahkan checklist tugas."
      });
      throw saveError;
    } finally {
      setIsSavingTaskChecklist(false);
    }
  };

  const handleToggleTaskChecklistItem = async (itemId: number, isDone: boolean) => {
    if (!selectedTaskId) return;
    setIsSavingTaskChecklist(true);
    try {
      await updateTaskChecklistItem(selectedTaskId, itemId, { is_done: isDone });
      await loadTaskChecklist(selectedTaskId);
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal memperbarui checklist tugas."
      });
    } finally {
      setIsSavingTaskChecklist(false);
    }
  };

  const handleDeleteTaskChecklistItem = async (itemId: number) => {
    if (!selectedTaskId) return;
    setIsSavingTaskChecklist(true);
    try {
      await deleteTaskChecklistItem(selectedTaskId, itemId);
      await loadTaskChecklist(selectedTaskId);
      setNotice({ type: "success", message: "Checklist berhasil dihapus." });
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal menghapus checklist tugas."
      });
    } finally {
      setIsSavingTaskChecklist(false);
    }
  };

  const handleCreateTask = async () => {
    if (!createTaskForm.project_id) {
      setNotice({ type: "error", message: "Pilih project terlebih dahulu." });
      return;
    }
    if (!createTaskForm.phase_id) {
      setNotice({ type: "error", message: "Pilih fase terlebih dahulu." });
      return;
    }
    if (!createTaskForm.assignee) {
      setNotice({ type: "error", message: "Pilih assignee terlebih dahulu." });
      return;
    }
    if (!createTaskForm.title.trim()) {
      setNotice({ type: "error", message: "Judul tugas wajib diisi." });
      return;
    }

    setIsSavingCreateTask(true);
    try {
      const result = await createTask({
        title: createTaskForm.title.trim(),
        priority: createTaskForm.priority,
        assignee: createTaskForm.assignee,
        project_id: createTaskForm.project_id,
        phase_id: createTaskForm.phase_id,
        progress_percentage: 0,
        start_date: createTaskForm.start_date || null,
        end_date: createTaskForm.end_date || null
      });
      if (profile && isAssignedToProfile(result.data.assignee, profile)) {
        setTasks((current) => [result.data, ...current]);
        setProgressDrafts((current) => ({ ...current, [result.data.id]: String(result.data.progress_percentage) }));
      }
      setCreateTaskForm((current) => ({
        ...current,
        title: "",
        phase_id: createTaskPhaseOptions[0]?.id ?? "",
        priority: "Medium",
        start_date: "",
        end_date: ""
      }));
      setIsCreateTaskModalOpen(false);
      setActiveTab("tasks");
      setNotice({ type: "success", message: result.message ?? "Tugas berhasil dibuat." });
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal membuat tugas."
      });
    } finally {
      setIsSavingCreateTask(false);
    }
  };

  const handleSaveTimesheet = async () => {
    const hours = Number(timesheetForm.hours_spent);
    if (!timesheetForm.project_id) {
      setNotice({ type: "error", message: "Pilih project terlebih dahulu." });
      return;
    }
    if (!timesheetForm.work_date) {
      setNotice({ type: "error", message: "Tanggal kerja wajib diisi." });
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      setNotice({ type: "error", message: "Jam kerja harus di antara 0 sampai 24 jam." });
      return;
    }

    setIsSavingTimesheet(true);
    try {
      const payload = {
        project_id: timesheetForm.project_id,
        task_id: timesheetForm.task_id || undefined,
        work_date: timesheetForm.work_date,
        hours_spent: hours,
        notes: timesheetForm.notes.trim(),
      };
      const result = editingTimesheetId
        ? await updateMyTimesheet(editingTimesheetId, payload)
        : await createMyTimesheet(payload);
      setTimesheets((current) =>
        editingTimesheetId
          ? current.map((item) => (item.id === result.data.id ? result.data : item))
          : [result.data, ...current]
      );
      setTimesheetForm((current) => ({ ...current, notes: "", hours_spent: "1", task_id: "" }));
      setIsTimesheetModalOpen(false);
      setEditingTimesheetId(null);
      if (searchParams.get("create") === "timesheet") {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete("create");
        setSearchParams(nextSearchParams, { replace: true });
      }
      setNotice({
        type: "success",
        message: result.message ?? (editingTimesheetId ? "Timesheet berhasil diperbarui." : "Timesheet berhasil ditambahkan."),
      });
    } catch (saveError) {
      setNotice({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Gagal menyimpan timesheet.",
      });
    } finally {
      setIsSavingTimesheet(false);
    }
  };

  const handleDeleteTimesheet = async (timesheetId: number) => {
    setDeletingTimesheetId(timesheetId);
    try {
      const result = await deleteMyTimesheet(timesheetId);
      setTimesheets((current) => current.filter((item) => item.id !== timesheetId));
      setNotice({ type: "success", message: result.message ?? "Timesheet berhasil dihapus." });
    } catch (deleteError) {
      setNotice({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Gagal menghapus timesheet.",
      });
    } finally {
      setDeletingTimesheetId(null);
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
              Tugas, isu/bug, dan jadwal meeting yang terkait dengan {profile?.employee_name ?? profile?.name ?? "akun Anda"}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <SummaryBadge icon={ListTodo} label={`${summary.openTasks} tugas aktif`} tone="indigo" />
            <SummaryBadge icon={CheckCircle2} label={`${summary.doneTasks} tugas selesai`} tone="emerald" />
            <SummaryBadge icon={Bug} label={`${summary.openIssues} isu aktif`} tone="red" />
            <SummaryBadge icon={AlertTriangle} label={`${summary.severeIssues} high risk`} tone="amber" />
            <SummaryBadge icon={Briefcase} label={`${summary.myProjects} proyek terlibat`} tone="slate" />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="grid w-full grid-cols-5 rounded-lg border border-slate-200 bg-white p-1 sm:w-[52rem]">
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
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "projects" ? "bg-slate-100 text-slate-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Proyek
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timesheets")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "timesheets" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Timesheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === "calendar" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Kalender
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
        ) : activeTab === "calendar" ? (
          <MyCalendarPage />
        ) : activeTab === "tasks" ? (
          <div className="space-y-4">
            <TaskFilterBar value={taskFilter} summary={summary} onChange={setTaskFilter} />
            <TaskTable
              tasks={paginatedTasks}
              emptyMessage={taskFilter === "active" ? "Tidak ada tugas aktif. Tugas dengan progress 100% ada di filter Selesai." : undefined}
              projectNameById={projectNameById}
              progressDrafts={progressDrafts}
              savingTaskId={savingTaskId}
              onProgressChange={(taskId, value) => setProgressDrafts((current) => ({ ...current, [taskId]: value }))}
              onSaveProgress={handleSaveTaskProgress}
              onOpenDetail={handleOpenTaskDetail}
            />
            <div className="rounded-lg border border-slate-200 bg-white">
              <PaginationControls page={taskPage} pageSize={PAGE_SIZE} totalItems={filteredTasks.length} onPageChange={setTaskPage} />
            </div>
          </div>
        ) : activeTab === "projects" ? (
          <div className="space-y-4">
            <ProjectTable projects={paginatedProjects} />
            <div className="rounded-lg border border-slate-200 bg-white">
              <PaginationControls page={projectPage} pageSize={PAGE_SIZE} totalItems={projects.length} onPageChange={setProjectPage} />
            </div>
          </div>
        ) : activeTab === "timesheets" ? (
          <div className="space-y-4">
            <TimesheetPanel
              projects={memberProjects}
              timesheets={paginatedTimesheets}
              deletingTimesheetId={deletingTimesheetId}
              onOpenForm={openCreateTimesheetModal}
              onEdit={openEditTimesheetModal}
              onDelete={handleDeleteTimesheet}
              projectNameById={projectNameById}
            />
            <div className="rounded-lg border border-slate-200 bg-white">
              <PaginationControls page={timesheetPage} pageSize={PAGE_SIZE} totalItems={timesheets.length} onPageChange={setTimesheetPage} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <IssueTable
              issues={paginatedIssues}
              projectNameById={projectNameById}
              savingIssueId={savingIssueId}
              onStatusChange={handleIssueStatusChange}
            />
            <div className="rounded-lg border border-slate-200 bg-white">
              <PaginationControls page={issuePage} pageSize={PAGE_SIZE} totalItems={issues.length} onPageChange={setIssuePage} />
            </div>
          </div>
        )}
      </div>

      {isTimesheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingTimesheetId ? "Edit Timesheet Harian" : "Input Timesheet Harian"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Catat jam kerja harian berdasarkan project dan tugas.</p>
              </div>
              <button
                type="button"
                onClick={closeTimesheetModal}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                disabled={isSavingTimesheet}
                aria-label="Tutup modal timesheet"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <TimesheetFormFields
                projects={memberProjects}
                taskOptions={timesheetTaskOptions}
                form={timesheetForm}
                isSaving={isSavingTimesheet}
                isLoadingTasks={isLoadingTimesheetTasks}
                onFormChange={setTimesheetForm}
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={closeTimesheetModal}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-60"
                disabled={isSavingTimesheet}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTimesheet}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={isSavingTimesheet}
              >
                {isSavingTimesheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTimesheetId ? "Update Timesheet" : "Simpan Timesheet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Buat Tugas Baru</h2>
                <p className="mt-0.5 text-xs text-slate-500">Pilih project dan fase sebelum menyimpan tugas.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                disabled={isSavingCreateTask}
                aria-label="Tutup modal tugas baru"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm font-semibold text-slate-700">
                Project
                <select
                  value={createTaskForm.project_id}
                  onChange={(event) =>
                    setCreateTaskForm((current) => ({ ...current, project_id: event.target.value, phase_id: "" }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSavingCreateTask}
                >
                  <option value="">- Pilih Project -</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Judul Tugas
                <input
                  type="text"
                  value={createTaskForm.title}
                  onChange={(event) => setCreateTaskForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Review kebutuhan modul reporting"
                  disabled={isSavingCreateTask}
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Fase
                  <select
                    value={createTaskForm.phase_id}
                    onChange={(event) => setCreateTaskForm((current) => ({ ...current, phase_id: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSavingCreateTask || isLoadingCreateTaskPhases}
                  >
                    <option value="">- Pilih Fase -</option>
                    {createTaskPhaseOptions.map((phase) => (
                      <option key={phase.id} value={phase.id}>
                        {phase.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Assignee
                  <select
                    value={createTaskForm.assignee}
                    onChange={(event) => setCreateTaskForm((current) => ({ ...current, assignee: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSavingCreateTask}
                  >
                    <option value="">- Pilih Assignee -</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Prioritas
                  <select
                    value={createTaskForm.priority}
                    onChange={(event) =>
                      setCreateTaskForm((current) => ({ ...current, priority: event.target.value as ApiTask["priority"] }))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSavingCreateTask}
                  >
                    {["Low", "Medium", "High", "Critical"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Mulai
                    <input
                      type="date"
                      value={createTaskForm.start_date}
                      onChange={(event) => setCreateTaskForm((current) => ({ ...current, start_date: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isSavingCreateTask}
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Selesai
                    <input
                      type="date"
                      value={createTaskForm.end_date}
                      min={createTaskForm.start_date || undefined}
                      onChange={(event) => setCreateTaskForm((current) => ({ ...current, end_date: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={isSavingCreateTask}
                    />
                  </label>
                </div>
              </div>
              {isLoadingCreateTaskPhases && (
                <p className="text-xs text-slate-500">Memuat fase project...</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-60"
                disabled={isSavingCreateTask}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={isSavingCreateTask || isLoadingCreateTaskPhases}
              >
                {isSavingCreateTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Tugas
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            priority: selectedTask.priority,
            assignee: selectedTask.assignee,
            createdBy: selectedTask.created_by,
            project: selectedTask.project_id,
            phaseId: selectedTask.phase_id,
            startDate: selectedTask.start_date,
            endDate: selectedTask.end_date,
            progressPercentage: selectedTask.progress_percentage,
            createdAt: selectedTask.created_at,
            updatedAt: selectedTask.updated_at
          }}
          projectName={projectNameById[selectedTask.project_id] ?? selectedTask.project_id}
          phaseName={selectedTask.phase_id || "Tanpa Fase"}
          assigneeName={resolveAssigneeDisplay(selectedTask.assignee)}
          comments={taskComments[selectedTask.id] ?? []}
          checklistItems={taskChecklistItems[selectedTask.id] ?? []}
          isLoadingComments={isLoadingTaskComments}
          isSavingComment={isSavingTaskComment}
          isLoadingChecklist={isLoadingTaskChecklist}
          isSavingChecklist={isSavingTaskChecklist}
          onClose={() => setSelectedTaskId(null)}
          onSubmitComment={handleSubmitTaskComment}
          onAddChecklistItem={handleAddTaskChecklistItem}
          onToggleChecklistItem={handleToggleTaskChecklistItem}
          onDeleteChecklistItem={handleDeleteTaskChecklistItem}
        />
      )}
    </div>
  );
}

function TimesheetFormFields({
  projects,
  taskOptions,
  form,
  isSaving,
  isLoadingTasks,
  onFormChange,
}: {
  projects: MyProjectResponse[];
  taskOptions: ApiTask[];
  form: { project_id: string; task_id: string; work_date: string; hours_spent: string; notes: string };
  isSaving: boolean;
  isLoadingTasks: boolean;
  onFormChange: (value: { project_id: string; task_id: string; work_date: string; hours_spent: string; notes: string }) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-700">
        Project
        <select
          value={form.project_id}
          onChange={(event) => onFormChange({ ...form, project_id: event.target.value, task_id: "" })}
          disabled={isSaving}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Pilih project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.id} - {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Tugas (opsional)
        <select
          value={form.task_id}
          onChange={(event) => onFormChange({ ...form, task_id: event.target.value })}
          disabled={isSaving || !form.project_id || isLoadingTasks}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{isLoadingTasks ? "Memuat tugas..." : "Tanpa tugas"}</option>
          {taskOptions.map((task) => (
            <option key={task.id} value={task.id}>
              {task.id} - {task.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Tanggal Kerja
        <input
          type="date"
          value={form.work_date}
          onChange={(event) => onFormChange({ ...form, work_date: event.target.value })}
          disabled={isSaving}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Jam Kerja
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.5}
          value={form.hours_spent}
          onChange={(event) => onFormChange({ ...form, hours_spent: event.target.value })}
          disabled={isSaving}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      <label className="md:col-span-2 text-sm font-semibold text-slate-700">
        Catatan
        <textarea
          value={form.notes}
          onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
          disabled={isSaving}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
    </div>
  );
}

function TimesheetPanel({
  projects,
  timesheets,
  deletingTimesheetId,
  onOpenForm,
  onEdit,
  onDelete,
  projectNameById,
}: {
  projects: MyProjectResponse[];
  timesheets: ApiTimesheet[];
  deletingTimesheetId: number | null;
  onOpenForm: () => void;
  onEdit: (timesheet: ApiTimesheet) => void;
  onDelete: (timesheetId: number) => void;
  projectNameById: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Timesheet Harian</h3>
          <p className="mt-0.5 text-xs text-slate-500">{projects.length} project tersedia untuk input timesheet.</p>
        </div>
        <button
          type="button"
          onClick={onOpenForm}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Input Timesheet
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Tugas</th>
              <th className="px-4 py-3 font-medium">Proyek</th>
              <th className="px-4 py-3 font-medium">Jam</th>
              <th className="px-4 py-3 font-medium">Catatan</th>
              <th className="px-4 py-3 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {timesheets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Belum ada data timesheet harian.
                </td>
              </tr>
            ) : (
              timesheets.map((item) => (
                <tr key={item.id} className="bg-white align-middle">
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.work_date)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <p className="font-medium text-slate-900">{item.task_id ?? "-"}</p>
                    <p className="text-xs text-slate-500">{displayValue(item.task_title ?? "-")}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.project_id ? projectNameById[item.project_id] ?? item.project_id : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.hours_spent}</td>
                  <td className="px-4 py-3 text-slate-700">{displayValue(item.notes)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        disabled={deletingTimesheetId === item.id}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={deletingTimesheetId === item.id}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {deletingTimesheetId === item.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskFilterBar({
  value,
  summary,
  onChange
}: {
  value: TaskCompletionFilter;
  summary: { openTasks: number; doneTasks: number };
  onChange: (value: TaskCompletionFilter) => void;
}) {
  const options: Array<{ key: TaskCompletionFilter; label: string; count: number }> = [
    { key: "active", label: "Aktif", count: summary.openTasks },
    { key: "done", label: "Selesai", count: summary.doneTasks },
    { key: "all", label: "Semua", count: summary.openTasks + summary.doneTasks }
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-grid grid-cols-3 rounded-lg border border-slate-200 bg-white p-1">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              value === option.key ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">Tugas progress 100% tidak tampil di daftar aktif.</p>
    </div>
  );
}

function TaskTable({
  tasks,
  emptyMessage,
  projectNameById,
  progressDrafts,
  savingTaskId,
  onProgressChange,
  onSaveProgress,
  onOpenDetail,
}: {
  tasks: ApiTask[];
  emptyMessage?: string;
  projectNameById: Record<string, string>;
  progressDrafts: Record<string, string>;
  savingTaskId: string | null;
  onProgressChange: (taskId: string, value: string) => void;
  onSaveProgress: (task: ApiTask) => void;
  onOpenDetail: (taskId: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {emptyMessage ?? "Belum ada tugas yang diassign ke akun Anda."}
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
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(task.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveProgress(task)}
                    disabled={savingTaskId === task.id}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {savingTaskId === task.id ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
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
  tone: "indigo" | "emerald" | "red" | "amber" | "slate";
}) {
  const styles: Record<typeof tone, string> = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium ${styles[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function ProjectTable({ projects }: { projects: MyProjectResponse[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Belum ada proyek yang melibatkan akun Anda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">ID Proyek</th>
            <th className="px-4 py-3 font-medium">Nama Proyek</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Prioritas</th>
            <th className="px-4 py-3 font-medium">PM</th>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Periode</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((project) => (
            <tr key={project.id} className="bg-white align-middle">
              <td className="px-4 py-3 font-medium text-slate-500">{project.id}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{project.name}</td>
              <td className="px-4 py-3 text-slate-700">{displayValue(project.status)}</td>
              <td className="px-4 py-3 text-slate-700">{displayValue(project.priority)}</td>
              <td className="px-4 py-3 text-slate-700">{displayValue(project.manager_name)}</td>
              <td className="px-4 py-3 text-slate-700">{project.member_count}</td>
              <td className="px-4 py-3 text-slate-700">{project.task_count}</td>
              <td className="px-4 py-3 text-slate-700">
                {formatDate(project.start_date)} - {formatDate(project.end_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
