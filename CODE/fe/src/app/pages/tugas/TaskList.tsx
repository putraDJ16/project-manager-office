import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, GitCommit, Layers3, List, Search, Settings2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { teamMembers } from "../../data/mockData";
import {
  createTaskChecklistItem,
  createTaskComment,
  deleteTaskChecklistItem,
  fetchPhases,
  fetchProjects,
  fetchTaskChecklist,
  fetchTaskComments,
  fetchTasks,
  updateTaskChecklistItem,
  type ApiTaskChecklistItem,
  type ApiTaskComment
} from "../../services/taskApi";
import { Badge, Button, Card, Input, PaginationControls, Select, SelectItem } from "../../components/ui";
import { TaskDetailModal } from "./TaskDetailModal";

type Project = { id: string; name: string; status: string };
type Phase = { id: string; projectId: string; name: string; order: number };
type Task = {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  createdBy: string;
  project: string;
  phaseId: string;
  startDate: string | null;
  endDate: string | null;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
};
type TaskComment = { id: number; authorName: string; content: string; createdAt: string };
type TaskChecklistItem = { id: number; title: string; isDone: boolean };
type NoticeState = { type: "success" | "error"; message: string } | null;
type DateStatus = "upcoming" | "on_progress" | "overdue";
const PAGE_SIZE = 10;

function toPhase(raw: { id: string; project_id: string; name: string; order_index: number }): Phase {
  return { id: raw.id, projectId: raw.project_id, name: raw.name, order: raw.order_index };
}

function toTask(raw: {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  created_by: string;
  project_id: string;
  phase_id: string;
  start_date: string | null;
  end_date: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}): Task {
  return {
    id: raw.id,
    title: raw.title,
    priority: raw.priority,
    assignee: raw.assignee,
    createdBy: raw.created_by,
    project: raw.project_id,
    phaseId: raw.phase_id,
    startDate: raw.start_date,
    endDate: raw.end_date,
    progressPercentage: raw.progress_percentage,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
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

function taskDateStatus(startDate: string | null, endDate: string | null): DateStatus | null {
  if (!startDate && !endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate) {
    const end = new Date(endDate);
    if (today > end) return "overdue";
  }
  if (startDate) {
    const start = new Date(startDate);
    if (today < start) return "upcoming";
  }
  return "on_progress";
}

const DATE_STATUS_CONFIG: Record<DateStatus, { label: string; color: "primary" | "success" | "warning" | "destructive" | "secondary" }> = {
  overdue: { label: "Lewat Deadline", color: "destructive" },
  on_progress: { label: "On Progress", color: "success" },
  upcoming: { label: "Belum Mulai", color: "primary" }
};

function taskStatus(task: Task, phaseById: Record<string, Phase>) {
  return phaseById[task.phaseId]?.name ?? "Tanpa Fase";
}

export function TaskList() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "wbs">("list");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [taskChecklistItems, setTaskChecklistItems] = useState<Record<string, TaskChecklistItem[]>>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const [page, setPage] = useState(1);

  const phasesForProject = useMemo(
    () =>
      phases
        .filter((phase) => phase.projectId === selectedProjectId)
        .sort((a, b) => a.order - b.order),
    [phases, selectedProjectId]
  );

  const phaseById = useMemo(
    () => phases.reduce<Record<string, Phase>>((acc, phase) => ({ ...acc, [phase.id]: phase }), {}),
    [phases]
  );

  const filteredTasks = useMemo(() => {
    const byProject = tasks.filter((task) => task.project === selectedProjectId);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return byProject;
    return byProject.filter((task) => {
      const phaseName = phaseById[task.phaseId]?.name ?? "";
      const assigneeName = teamMembers.find((member) => member.id === task.assignee)?.name ?? "";
      return `${task.id} ${task.title} ${phaseName} ${assigneeName} ${task.createdBy}`
        .toLowerCase()
        .includes(query);
    });
  }, [phaseById, searchQuery, selectedProjectId, tasks]);
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, page]);

  const hasSearchInput = searchInput.trim().length > 0;
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const reloadProjectData = async (projectId: string, query = searchQuery) => {
    if (!projectId) return;
    const [phaseRows, taskRows] = await Promise.all([fetchPhases(projectId), fetchTasks(projectId, query)]);
    setPhases((current) => [
      ...current.filter((phase) => phase.projectId !== projectId),
      ...phaseRows.map(toPhase)
    ]);
    setTasks((current) => [
      ...current.filter((task) => task.project !== projectId),
      ...taskRows.map(toTask)
    ]);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const rows = await fetchProjects();
        const mapped = rows.map((project) => ({ id: project.id, name: project.name, status: project.status }));
        setProjects(mapped);
        setSelectedProjectId(mapped[0]?.id ?? "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat data monitoring tugas.";
        setNotice({ type: "error", message });
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    void reloadProjectData(selectedProjectId, searchQuery);
  }, [searchQuery, selectedProjectId]);
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedProjectId, view]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const loadTaskComments = async (taskId: string) => {
    setIsLoadingComments(true);
    try {
      const commentRows = await fetchTaskComments(taskId);
      setTaskComments((current) => ({ ...current, [taskId]: commentRows.map(toTaskComment) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat komentar tugas.";
      setNotice({ type: "error", message });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadTaskChecklist = async (taskId: string) => {
    setIsLoadingChecklist(true);
    try {
      const rows = await fetchTaskChecklist(taskId);
      setTaskChecklistItems((current) => ({ ...current, [taskId]: rows.map(toTaskChecklistItem) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat checklist tugas.";
      setNotice({ type: "error", message });
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  const handleOpenTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    await Promise.all([loadTaskComments(taskId), loadTaskChecklist(taskId)]);
  };

  const handleSubmitTaskComment = async (content: string) => {
    if (!selectedTaskId) return;
    setIsSavingComment(true);
    try {
      await createTaskComment(selectedTaskId, { content });
      await loadTaskComments(selectedTaskId);
      setNotice({ type: "success", message: "Komentar berhasil ditambahkan." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menambahkan komentar.";
      setNotice({ type: "error", message });
      throw error;
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleAddChecklistItem = async (title: string) => {
    if (!selectedTaskId) return;
    setIsSavingChecklist(true);
    try {
      await createTaskChecklistItem(selectedTaskId, { title });
      await loadTaskChecklist(selectedTaskId);
      setNotice({ type: "success", message: "Checklist berhasil ditambahkan." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menambahkan checklist.";
      setNotice({ type: "error", message });
      throw error;
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: number, isDone: boolean) => {
    if (!selectedTaskId) return;
    setIsSavingChecklist(true);
    try {
      await updateTaskChecklistItem(selectedTaskId, itemId, { is_done: isDone });
      await loadTaskChecklist(selectedTaskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui checklist.";
      setNotice({ type: "error", message });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    if (!selectedTaskId) return;
    setIsSavingChecklist(true);
    try {
      await deleteTaskChecklistItem(selectedTaskId, itemId);
      await loadTaskChecklist(selectedTaskId);
      setNotice({ type: "success", message: "Checklist berhasil dihapus." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus checklist.";
      setNotice({ type: "error", message });
    } finally {
      setIsSavingChecklist(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Manajemen Tugas</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Monitoring</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Monitoring Tugas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Halaman ini read-only. Pengelolaan tugas dilakukan dari detail proyek.
          </p>
        </div>
        <Button
          type="button"
          disabled={!selectedProjectId}
          onClick={() => selectedProjectId && navigate(`/proyek/${selectedProjectId}`)}
        >
          <Settings2 className="w-4 h-4" />
          Kelola di Proyek
        </Button>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari tugas..."
              leadingIcon={<Search className="w-4 h-4" />}
              className="h-8 w-72 pr-10 py-1.5"
            />
            {hasSearchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm">
            Cari
          </Button>
        </form>
        <Button type="button" variant="outline" color="secondary" size="sm">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
        <div className="ml-2 flex items-center gap-2 text-sm text-slate-600">
          <Layers3 className="w-4 h-4 text-slate-500" />
          <span>Project Aktif</span>
        </div>
        <div className="w-64">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId} placeholder="Pilih project">
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="ml-auto text-xs font-medium text-slate-500">
          {phasesForProject.length} fase | {filteredTasks.length} tugas
        </div>
      </div>

      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200 w-full">
          <Button
            type="button"
            variant={view === "list" ? "solid" : "ghost"}
            color={view === "list" ? "secondary" : "secondary"}
            size="sm"
            onClick={() => setView("list")}
            className={view === "list" ? "text-indigo-700" : "text-slate-600"}
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button
            type="button"
            variant={view === "wbs" ? "solid" : "ghost"}
            color={view === "wbs" ? "secondary" : "secondary"}
            size="sm"
            onClick={() => setView("wbs")}
            className={view === "wbs" ? "text-indigo-700" : "text-slate-600"}
          >
            <GitCommit className="w-4 h-4" />
            WBS
          </Button>
        </div>
      </div>

      {notice && (
        <div className="fixed top-5 right-5 z-[60]">
          <div
            className={`rounded-md border px-3 py-2 text-sm shadow-lg ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.message}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-slate-50/50 p-6 relative">
        {isLoading && (
          <Card variant="outlined" className="border-dashed p-8 text-center text-sm text-slate-500 bg-white">
            Memuat data monitoring tugas...
          </Card>
        )}

        {!isLoading && view === "list" && (
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Judul</th>
                  <th className="px-4 py-3 font-medium">Fase</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Dibuat Oleh</th>
                  <th className="px-4 py-3 font-medium">Tanggal Mulai</th>
                  <th className="px-4 py-3 font-medium">Tanggal Selesai</th>
                  <th className="px-4 py-3 font-medium">Status Waktu</th>
                  <th className="px-4 py-3 font-medium">Prioritas</th>
                  <th className="px-4 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-medium">{task.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">{taskStatus(task, phaseById)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {teamMembers.find((member) => member.id === task.assignee)?.name ?? task.assignee}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{task.createdBy}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.startDate
                        ? new Date(task.startDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.endDate
                        ? new Date(task.endDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const status = taskDateStatus(task.startDate, task.endDate);
                        return status ? (
                          <Badge color={DATE_STATUS_CONFIG[status].color} className="rounded-md px-2 py-0.5">
                            {DATE_STATUS_CONFIG[status].label}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="secondary" className="rounded-md px-2 py-0.5">
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        color="secondary"
                        size="sm"
                        onClick={() => void handleOpenTaskDetail(task.id)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredTasks.length} onPageChange={setPage} className="border-t border-slate-200" />
          </Card>
        )}

        {!isLoading && view === "wbs" && (
          <Card className="overflow-hidden">
            {phasesForProject.map((phase, index) => (
              <div key={phase.id} className="border-b border-slate-100">
                <div className="px-6 py-3.5 bg-slate-50/50 flex items-center">
                  <div className="flex-1 font-semibold text-slate-800">
                    {index + 1}.0 {phase.name}
                  </div>
                </div>
                {filteredTasks
                  .filter((task) => task.phaseId === phase.id)
                  .map((task) => (
                    <div key={task.id} className="px-6 py-3 hover:bg-slate-50">
                      <button
                        type="button"
                        onClick={() => void handleOpenTaskDetail(task.id)}
                        className="text-left w-full"
                      >
                        <span className="text-slate-400 w-12 text-xs mr-3">{task.id}</span>
                        <span className="text-slate-700">{task.title}</span>
                      </button>
                    </div>
                  ))}
              </div>
            ))}
          </Card>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectName={projects.find((project) => project.id === selectedTask.project)?.name ?? selectedTask.project}
          phaseName={phaseById[selectedTask.phaseId]?.name ?? "Tanpa Fase"}
          assigneeName={teamMembers.find((member) => member.id === selectedTask.assignee)?.name ?? selectedTask.assignee}
          comments={taskComments[selectedTask.id] ?? []}
          checklistItems={taskChecklistItems[selectedTask.id] ?? []}
          isLoadingComments={isLoadingComments}
          isSavingComment={isSavingComment}
          isLoadingChecklist={isLoadingChecklist}
          isSavingChecklist={isSavingChecklist}
          canEditChecklist
          onClose={() => setSelectedTaskId(null)}
          onSubmitComment={handleSubmitTaskComment}
          onAddChecklistItem={handleAddChecklistItem}
          onToggleChecklistItem={handleToggleChecklistItem}
          onDeleteChecklistItem={handleDeleteChecklistItem}
        />
      )}
    </div>
  );
}
