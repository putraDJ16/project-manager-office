import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, GitCommit, Layers3, List, Search, Settings2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { teamMembers } from "../../data/mockData";
import { fetchPhases, fetchProjects, fetchTasks } from "../../services/taskApi";

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
};
type NoticeState = { type: "success" | "error"; message: string } | null;
type DateStatus = "upcoming" | "on_progress" | "overdue";

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
    endDate: raw.end_date
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

const DATE_STATUS_CONFIG: Record<DateStatus, { label: string; className: string }> = {
  overdue: { label: "Lewat Deadline", className: "bg-red-100 text-red-700" },
  on_progress: { label: "On Progress", className: "bg-emerald-100 text-emerald-700" },
  upcoming: { label: "Belum Mulai", className: "bg-blue-100 text-blue-700" }
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

  const hasSearchInput = searchInput.trim().length > 0;

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
        <button
          type="button"
          disabled={!selectedProjectId}
          onClick={() => selectedProjectId && navigate(`/proyek/${selectedProjectId}`)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Kelola di Proyek
        </button>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari tugas..."
              className="pl-9 pr-10 py-1.5 w-72 border border-slate-300 rounded-md text-sm"
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
          <button
            type="submit"
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Cari
          </button>
        </form>
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
        <div className="ml-2 flex items-center gap-2 text-sm text-slate-600">
          <Layers3 className="w-4 h-4 text-slate-500" />
          <span>Project Aktif</span>
        </div>
        <select
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm font-medium bg-white shadow-sm"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs font-medium text-slate-500">
          {phasesForProject.length} fase | {filteredTasks.length} tugas
        </div>
      </div>

      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200 w-full">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
              view === "list" ? "bg-slate-100 text-indigo-700" : "text-slate-600"
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </button>
          <button
            onClick={() => setView("wbs")}
            className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
              view === "wbs" ? "bg-slate-100 text-indigo-700" : "text-slate-600"
            }`}
          >
            <GitCommit className="w-4 h-4 mr-2" />
            WBS
          </button>
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
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Memuat data monitoring tugas...
          </div>
        )}

        {!isLoading && view === "list" && (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
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
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md ${DATE_STATUS_CONFIG[status].className}`}
                          >
                            {DATE_STATUS_CONFIG[status].label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                        {task.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && view === "wbs" && (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
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
                      <span className="text-slate-400 w-12 text-xs mr-3">{task.id}</span>
                      {task.title}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
