import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Filter, GitCommit, KanbanSquare, Layers3, List, Plus, Search, X } from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { teamMembers } from "../../data/mockData";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { TaskFormFields, type TaskFormState, type TaskPriority } from "./TaskFormFields";
import { createPhase, createProject, createTask, fetchPhases, fetchProjects, fetchTasks, updateTask } from "../../services/taskApi";

type Project = { id: string; name: string; status: string };
type Phase = { id: string; projectId: string; name: string; order: number };
type Task = {
  id: string;
  title: string;
  priority: TaskPriority;
  assignee: string;
  createdBy: string;
  project: string;
  phaseId: string;
  createdAt: string;
  updatedAt: string;
  phaseUpdatedAt: string | null;
};
type NoticeState = { type: "success" | "error"; message: string } | null;

function toPhase(raw: { id: string; project_id: string; name: string; order_index: number }): Phase {
  return { id: raw.id, projectId: raw.project_id, name: raw.name, order: raw.order_index };
}

function toTask(raw: {
  id: string;
  title: string;
  priority: TaskPriority;
  assignee: string;
  created_by: string;
  project_id: string;
  phase_id: string;
  created_at: string;
  updated_at: string;
  phase_updated_at: string | null;
}): Task {
  return {
    id: raw.id,
    title: raw.title,
    priority: raw.priority,
    assignee: raw.assignee,
    createdBy: raw.created_by,
    project: raw.project_id,
    phaseId: raw.phase_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    phaseUpdatedAt: raw.phase_updated_at
  };
}

function taskStatus(task: Task, phaseById: Record<string, Phase>) {
  return phaseById[task.phaseId]?.name ?? "Tanpa Fase";
}

function formatDateTimeLabel(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function TaskList() {
  const [view, setView] = useState<"list" | "kanban" | "wbs">("list");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [modalType, setModalType] = useState<"project" | "phase" | "task" | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  const [projectForm, setProjectForm] = useState({ name: "", status: "Planning" });
  const [phaseForm, setPhaseForm] = useState({ name: "" });
  const [taskForm, setTaskForm] = useState<TaskFormState>({
    title: "",
    phaseId: "",
    assignee: teamMembers[0]?.id ?? "",
    priority: "Medium"
  });

  const activeProject = useMemo(() => projects.find((project) => project.id === selectedProjectId), [projects, selectedProjectId]);
  const phasesForProject = useMemo(() => phases.filter((phase) => phase.projectId === selectedProjectId).sort((a, b) => a.order - b.order), [phases, selectedProjectId]);
  const phaseById = useMemo(() => phases.reduce<Record<string, Phase>>((acc, phase) => ({ ...acc, [phase.id]: phase }), {}), [phases]);
  const filteredTasks = useMemo(() => {
    const byProject = tasks.filter((task) => task.project === selectedProjectId);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return byProject;
    return byProject.filter((task) => {
      const phaseName = phaseById[task.phaseId]?.name ?? "";
      const assigneeName = teamMembers.find((member) => member.id === task.assignee)?.name ?? "";
      return `${task.id} ${task.title} ${phaseName} ${assigneeName} ${task.createdBy}`.toLowerCase().includes(query);
    });
  }, [phaseById, searchQuery, selectedProjectId, tasks]);
  const selectedTaskData = useMemo(() => tasks.find((task) => task.id === selectedTask) ?? null, [selectedTask, tasks]);
  const hasSearchInput = searchInput.trim().length > 0;
  const setSuccessNotice = (message: string) => setNotice({ type: "success", message });
  const setErrorNotice = (message: string) => setNotice({ type: "error", message });

  const reloadProjectData = async (projectId: string, query = searchQuery) => {
    if (!projectId) return;
    const [phaseRows, taskRows] = await Promise.all([fetchPhases(projectId), fetchTasks(projectId, query)]);
    setPhases((current) => [...current.filter((phase) => phase.projectId !== projectId), ...phaseRows.map(toPhase)]);
    setTasks((current) => [...current.filter((task) => task.project !== projectId), ...taskRows.map(toTask)]);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const rows = await fetchProjects();
        const mapped = rows.map((project) => ({ id: project.id, name: project.name, status: project.status }));
        setProjects(mapped);
        const firstId = mapped[0]?.id ?? "";
        setSelectedProjectId(firstId);
      } catch (error) {
        setErrorNotice(error instanceof Error ? error.message : "Gagal memuat data tugas.");
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (addMenuRef.current && !addMenuRef.current.contains(target)) setIsAddMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const openTaskModal = () => {
    setIsAddMenuOpen(false);
    if (phasesForProject.length === 0) return;
    setTaskForm({ title: "", phaseId: phasesForProject[0].id, assignee: teamMembers[0]?.id ?? "", priority: "Medium" });
    setModalType("task");
  };

  const handleAddProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitLoading) return;
    setIsSubmitLoading(true);
    try {
      const result = await createProject({ name: projectForm.name.trim(), status: projectForm.status });
      const created = result.data;
      setProjects((current) => [...current, { id: created.id, name: created.name, status: created.status }]);
      setSelectedProjectId(created.id);
      await reloadProjectData(created.id, "");
      setModalType(null);
      setSuccessNotice(result.message ?? `Project ${created.name} berhasil ditambahkan.`);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "Gagal menambah project.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleAddPhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProject) return;
    if (isSubmitLoading) return;
    setIsSubmitLoading(true);
    try {
      const result = await createPhase(activeProject.id, { name: phaseForm.name.trim() });
      const created = result.data;
      setPhases((current) => [...current.filter((phase) => phase.id !== created.id), toPhase(created)]);
      setModalType(null);
      setSuccessNotice(result.message ?? `Fase ${created.name} berhasil ditambahkan.`);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "Gagal menambah fase.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProject) return;
    if (isSubmitLoading) return;
    setIsSubmitLoading(true);
    try {
      const result = await createTask({
        title: taskForm.title.trim(),
        phase_id: taskForm.phaseId,
        assignee: taskForm.assignee,
        priority: taskForm.priority,
        project_id: activeProject.id
      });
      const created = result.data;
      setTasks((current) => [...current, toTask(created)]);
      setModalType(null);
      setSuccessNotice(result.message ?? `Tugas ${created.title} berhasil ditambahkan.`);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "Gagal menambah tugas.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleUpdateTask = async (form: TaskFormState) => {
    if (!selectedTaskData) return;
    try {
      const updated = await updateTask(selectedTaskData.id, {
        title: form.title.trim(),
        phase_id: form.phaseId,
        assignee: form.assignee,
        priority: form.priority
      });
      const mapped = toTask(updated);
      setTasks((current) => current.map((task) => (task.id === mapped.id ? mapped : task)));
      setSelectedTask(null);
      setSuccessNotice(`Tugas ${mapped.title} berhasil diperbarui.`);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "Gagal memperbarui tugas.");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const destinationPhaseId = result.destination.droppableId;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, phaseId: destinationPhaseId } : task)));
    try {
      const updated = await updateTask(taskId, { phase_id: destinationPhaseId });
      const mapped = toTask(updated);
      setTasks((current) => current.map((task) => (task.id === mapped.id ? mapped : task)));
    } catch {
      await reloadProjectData(selectedProjectId, searchQuery);
      setErrorNotice("Gagal memindahkan tugas.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1"><span>Proyek</span><span className="mx-2">/</span><span className="font-medium text-slate-700">{activeProject?.name ?? "Belum Dipilih"}</span></div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tugas (Project - Fase - Tugas)</h1>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button type="button" onClick={() => setIsAddMenuOpen((current) => !current)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />Tambah <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isAddMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-20 p-1">
              <button type="button" onClick={() => { setProjectForm({ name: "", status: "Planning" }); setModalType("project"); setIsAddMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-50">Tambah Project</button>
              <button type="button" onClick={() => { setPhaseForm({ name: `Fase ${phasesForProject.length + 1}` }); setModalType("phase"); setIsAddMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-50 disabled:opacity-40" disabled={!activeProject}>Tambah Fase</button>
              <button type="button" onClick={openTaskModal} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-slate-50 disabled:opacity-40" disabled={!activeProject || phasesForProject.length === 0}>Tambah Tugas</button>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari tugas..." className="pl-9 pr-10 py-1.5 w-72 border border-slate-300 rounded-md text-sm" />
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
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700">Cari</button>
        </form>
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md"><Filter className="w-4 h-4 mr-2" />Filter</button>
        <div className="ml-2 flex items-center gap-2 text-sm text-slate-600"><Layers3 className="w-4 h-4 text-slate-500" /><span>Project Aktif</span></div>
        <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="border border-slate-300 rounded-md py-1.5 px-3 text-sm font-medium bg-white shadow-sm">
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <div className="ml-auto text-xs font-medium text-slate-500">{phasesForProject.length} fase | {filteredTasks.length} tugas</div>
      </div>

      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-3 bg-white p-1 rounded-lg border border-slate-200 w-full">
          <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${view === "list" ? "bg-slate-100 text-indigo-700" : "text-slate-600"}`}><List className="w-4 h-4 mr-2" />List</button>
          <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${view === "kanban" ? "bg-slate-100 text-indigo-700" : "text-slate-600"}`}><KanbanSquare className="w-4 h-4 mr-2" />Board</button>
          <button onClick={() => setView("wbs")} className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${view === "wbs" ? "bg-slate-100 text-indigo-700" : "text-slate-600"}`}><GitCommit className="w-4 h-4 mr-2" />WBS</button>
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
        {isLoading && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Memuat data tugas...</div>}
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
                  <th className="px-4 py-3 font-medium">Tanggal Buat</th>
                  <th className="px-4 py-3 font-medium">Edit Fase Terakhir</th>
                  <th className="px-4 py-3 font-medium">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-slate-50 cursor-pointer ${selectedTask === task.id ? "bg-indigo-50/50" : ""}`} onClick={() => setSelectedTask(task.id)}>
                    <td className="px-4 py-3 text-slate-500 font-medium">{task.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                    <td className="px-4 py-3 text-slate-600">{taskStatus(task, phaseById)}</td>
                    <td className="px-4 py-3 text-slate-600">{teamMembers.find((member) => member.id === task.assignee)?.name ?? task.assignee}</td>
                    <td className="px-4 py-3 text-slate-600">{task.createdBy}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTimeLabel(task.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTimeLabel(task.phaseUpdatedAt)}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">{task.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && view === "kanban" && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full overflow-x-auto pb-4">
              {phasesForProject.map((phase) => (
                <div key={phase.id} className="w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200">
                  <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <h3 className="font-semibold text-slate-800 text-sm">{phase.name}</h3>
                    <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{filteredTasks.filter((task) => task.phaseId === phase.id).length}</span>
                  </div>
                  <Droppable droppableId={phase.id}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                        {filteredTasks.filter((task) => task.phaseId === phase.id).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(dragProvided) => (
                              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps} onClick={() => setSelectedTask(task.id)} className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer hover:shadow-md ${selectedTask === task.id ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200"}`}>
                                <div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-slate-400">{task.id}</span><span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">{task.priority}</span></div>
                                <h4 className="font-medium text-slate-900 mb-3 text-sm">{task.title}</h4>
                                <p className="text-xs text-slate-500">Dibuat oleh: {task.createdBy}</p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {!isLoading && view === "wbs" && (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
            {phasesForProject.map((phase, index) => (
              <div key={phase.id} className="border-b border-slate-100">
                <div className="px-6 py-3.5 bg-slate-50/50 flex items-center"><div className="flex-1 font-semibold text-slate-800">{index + 1}.0 {phase.name}</div></div>
                {filteredTasks.filter((task) => task.phaseId === phase.id).map((task) => (
                  <div key={task.id} onClick={() => setSelectedTask(task.id)} className={`px-6 py-3 cursor-pointer hover:bg-slate-50 ${selectedTask === task.id ? "bg-indigo-50/50" : ""}`}>
                    <span className="text-slate-400 w-12 text-xs mr-3">{task.id}</span>{task.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalType && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            if (isSubmitLoading) return;
            setModalType(null);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {modalType === "project" && "Tambah Project Baru"}
                {modalType === "phase" && `Tambah Fase (${activeProject?.name ?? "-"})`}
                {modalType === "task" && `Tambah Tugas (${activeProject?.name ?? "-"})`}
              </h2>
              <button onClick={() => setModalType(null)} disabled={isSubmitLoading} className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"><X className="w-5 h-5" /></button>
            </div>
            {modalType === "project" && (
              <form onSubmit={handleAddProject} className="p-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Nama Project</label>
                <input type="text" value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" required />
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} disabled={isSubmitLoading} className="px-4 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">Batal</button><button type="submit" disabled={isSubmitLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitLoading ? "Menyimpan..." : "Simpan Project"}</button></div>
              </form>
            )}
            {modalType === "phase" && (
              <form onSubmit={handleAddPhase} className="p-5 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Nama Fase</label>
                <input type="text" value={phaseForm.name} onChange={(event) => setPhaseForm({ name: event.target.value })} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" required />
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} disabled={isSubmitLoading} className="px-4 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">Batal</button><button type="submit" disabled={isSubmitLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitLoading ? "Menyimpan..." : "Simpan Fase"}</button></div>
              </form>
            )}
            {modalType === "task" && (
              <form onSubmit={handleAddTask} className="p-5 space-y-4">
                <TaskFormFields value={taskForm} onChange={setTaskForm} phaseOptions={phasesForProject} assigneeOptions={teamMembers.map((member) => ({ id: member.id, name: member.name }))} />
                {isSubmitLoading && <p className="text-sm text-slate-600">Mengirim data tugas ke backend...</p>}
                <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalType(null)} disabled={isSubmitLoading} className="px-4 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">Batal</button><button type="submit" disabled={isSubmitLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitLoading ? "Menyimpan..." : "Simpan Tugas"}</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {selectedTaskData && (
        <TaskDetailPanel
          task={selectedTaskData}
          projectName={activeProject?.name ?? "-"}
          phaseOptions={phasesForProject}
          assigneeOptions={teamMembers.map((member) => ({ id: member.id, name: member.name }))}
          onClose={() => setSelectedTask(null)}
          onSave={handleUpdateTask}
        />
      )}
    </div>
  );
}
