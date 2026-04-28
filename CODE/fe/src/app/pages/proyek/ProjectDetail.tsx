import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Users, CheckSquare, Layers, Loader2,
  AlertCircle, Plus, Trash2, Edit2, X, Calendar, User, Activity,
  Save
} from "lucide-react";
import {
  getProject, updateProject,
  addProjectMember, removeProjectMember,
  type ApiProjectDetail, type ApiProjectMember,
} from "../../services/projectApi";
import { fetchEmployees } from "../../services/masterApi";
import { fetchPhases, fetchTasks, createTask, type ApiPhase, type ApiTask } from "../../services/taskApi";
import type { Employee } from "../../data/masterData";

const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Completed"];
const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Planning: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-slate-100 text-slate-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

type Tab = "ringkasan" | "anggota" | "tugas";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ApiProjectDetail | null>(null);
  const [phases, setPhases] = useState<ApiPhase[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("ringkasan");

  // Edit project state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<{
    name: string; description: string; status: string;
    priority: string; manager_id: string; start_date: string; end_date: string;
  }>>({});
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSaving, setMemberSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    phase_id: "",
    assignee: "",
    priority: "Medium" as string,
    start_date: "",
    end_date: "",
  });
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProject(id),
      fetchPhases(id),
      fetchTasks(id, ""),
      fetchEmployees(),
    ])
      .then(([proj, ph, tk, emps]) => {
        setProject(proj);
        setPhases(ph);
        setTasks(tk);
        setEmployees(emps);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      priority: project.priority ?? "",
      manager_id: project.manager_id ?? "",
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? "",
    });
    setEditMode(true);
    setSaveNotice(null);
  };

  const handleSaveEdit = async () => {
    if (!id || !project) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      const updated = await updateProject(id, {
        name: editForm.name?.trim() || project.name,
        description: editForm.description?.trim() || undefined,
        status: editForm.status || project.status,
        priority: editForm.priority || undefined,
        manager_id: editForm.manager_id || undefined,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined,
      });
      setProject((prev) => prev ? { ...prev, ...updated.data } : prev);
      setEditMode(false);
      setSaveNotice({ type: "success", msg: "Proyek berhasil diperbarui." });
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: unknown) {
      setSaveNotice({ type: "error", msg: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!id || !selectedEmployeeId) return;
    setMemberSaving(true);
    setMemberError(null);
    try {
      const result = await addProjectMember(id, selectedEmployeeId);
      setProject((prev) =>
        prev ? { ...prev, members: [...prev.members, result.data], member_count: prev.member_count + 1 } : prev
      );
      setSelectedEmployeeId("");
      setShowAddMember(false);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Gagal menambahkan anggota.");
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!id) return;
    setRemovingId(employeeId);
    try {
      await removeProjectMember(id, employeeId);
      setProject((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.employee_id !== employeeId), member_count: prev.member_count - 1 }
          : prev
      );
    } catch {
      // silently ignore
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddTask = async () => {
    if (!id || !taskForm.title.trim()) return;
    if (!taskForm.phase_id) { setTaskError("Pilih fase untuk tugas ini."); return; }
    if (taskForm.start_date && taskForm.end_date && taskForm.end_date < taskForm.start_date) {
      setTaskError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    setTaskSaving(true);
    setTaskError(null);
    try {
      const result = await createTask({
        title: taskForm.title.trim(),
        priority: taskForm.priority as ApiTask["priority"],
        assignee: taskForm.assignee,
        project_id: id,
        phase_id: taskForm.phase_id,
        start_date: taskForm.start_date || null,
        end_date: taskForm.end_date || null,
      });
      setTasks((prev) => [result.data, ...prev]);
      setTaskForm({
        title: "",
        phase_id: "",
        assignee: "",
        priority: "Medium",
        start_date: "",
        end_date: "",
      });
      setShowAddTask(false);
    } catch (err: unknown) {
      setTaskError(err instanceof Error ? err.message : "Gagal menambahkan tugas.");
    } finally {
      setTaskSaving(false);
    }
  };

  const memberEmployeeIds = new Set(project?.members.map((m) => m.employee_id) ?? []);
  const availableEmployees = employees.filter((e) => e.status === "Active" && !memberEmployeeIds.has(e.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat detail proyek...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>{error ?? "Proyek tidak ditemukan."}</p>
        <button onClick={() => navigate("/proyek/list")} className="text-indigo-600 hover:underline text-sm">
          ← Kembali ke daftar proyek
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/proyek/list")}
            className="mt-1 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center text-xs text-slate-400 mb-1 gap-1">
              <span className="hover:underline cursor-pointer" onClick={() => navigate("/proyek/list")}>Proyek</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{project.name}</span>
            </div>
            {editMode ? (
              <input
                type="text"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className="text-2xl font-bold text-slate-900 border-b-2 border-indigo-400 focus:outline-none bg-transparent w-full max-w-lg"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-600"}`}>
                <Activity className="w-3 h-3 mr-1" />{project.status}
              </span>
              {project.priority && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[project.priority] ?? ""}`}>
                  {project.priority}
                </span>
              )}
              {project.manager_name && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5" />{project.manager_name}
                </span>
              )}
              {project.start_date && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  {project.end_date && (
                    <> — {new Date(project.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          {saveNotice && (
            <span className={`text-xs px-3 py-1.5 rounded-md border ${saveNotice.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {saveNotice.msg}
            </span>
          )}
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600">
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Simpan
              </button>
            </>
          ) : (
            <button onClick={openEdit} className="flex items-center px-4 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600">
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit Proyek
            </button>
          )}
        </div>
      </div>

      {/* Edit form (inline, shown when editMode) */}
      {editMode && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select value={editForm.status ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prioritas</label>
              <select value={editForm.priority ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Tidak Ada —</option>
                {PROJECT_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</label>
              <input type="date" value={editForm.start_date ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</label>
              <input type="date" value={editForm.end_date ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Manajer Proyek</label>
              <select value={editForm.manager_id ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, manager_id: e.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— Tidak Ada —</option>
                {employees.filter((e) => e.status === "Active").map((e) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.position}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Deskripsi</label>
              <textarea value={editForm.description ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2} className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="px-6 border-b border-slate-200 flex items-center gap-0">
        {([
          { key: "ringkasan", label: "Ringkasan", icon: Layers },
          { key: "anggota", label: `Anggota (${project.member_count})`, icon: Users },
          { key: "tugas", label: `Tugas (${tasks.length})`, icon: CheckSquare },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">

        {/* ── RINGKASAN ── */}
        {activeTab === "ringkasan" && (
          <div className="max-w-3xl space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Fase" value={phases.length} icon={Layers} color="indigo" />
              <StatCard label="Total Tugas" value={tasks.length} icon={CheckSquare} color="violet" />
              <StatCard label="Anggota Tim" value={project.member_count} icon={Users} color="sky" />
            </div>

            {/* Description */}
            {project.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            {/* Phases list */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Fase Proyek</h3>
              {phases.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada fase.</p>
              ) : (
                <div className="space-y-2">
                  {phases.map((phase, index) => {
                    const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);
                    return (
                      <div key={phase.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{phase.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{phaseTasks.length} tugas</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANGGOTA ── */}
        {activeTab === "anggota" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Anggota Tim</h3>
              <button
                onClick={() => { setShowAddMember(true); setMemberError(null); setSelectedEmployeeId(""); }}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Anggota
              </button>
            </div>

            {/* Add member inline form */}
            {showAddMember && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 mb-2">Tambah Anggota Baru</p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Pilih Pegawai —</option>
                    {availableEmployees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} — {e.position} ({e.organization})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedEmployeeId || memberSaving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60 shrink-0"
                  >
                    {memberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah"}
                  </button>
                  <button onClick={() => setShowAddMember(false)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {memberError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{memberError}
                  </p>
                )}
              </div>
            )}

            {project.members.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada anggota. Tambahkan pegawai ke proyek ini.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium text-left">Nama</th>
                      <th className="px-4 py-3 font-medium text-left">Jabatan</th>
                      <th className="px-4 py-3 font-medium text-left">Unit</th>
                      <th className="px-4 py-3 font-medium text-left">Bergabung</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.members.map((member) => (
                      <MemberRow
                        key={member.employee_id}
                        member={member}
                        removing={removingId === member.employee_id}
                        onRemove={() => handleRemoveMember(member.employee_id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TUGAS ── */}
        {activeTab === "tugas" && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Daftar Tugas</h3>
              <button
                onClick={() => {
                  setShowAddTask(true);
                  setTaskError(null);
                  setTaskForm({
                    title: "",
                    phase_id: "",
                    assignee: "",
                    priority: "Medium",
                    start_date: "",
                    end_date: "",
                  });
                }}
                className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Tugas
              </button>
            </div>

            {/* Add task inline form */}
            {showAddTask && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 mb-3">Tambah Tugas Baru</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Judul tugas..."
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fase</label>
                    <select
                      value={taskForm.phase_id}
                      onChange={(e) => setTaskForm((p) => ({ ...p, phase_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Pilih Fase —</option>
                      {phases.map((ph) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Prioritas</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TASK_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Assignee</label>
                    <select
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm((p) => ({ ...p, assignee: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Tidak Diassign —</option>
                      {project.members.length > 0
                        ? project.members.map((m) => <option key={m.employee_id} value={m.employee_id}>{m.employee_name}</option>)
                        : employees.filter((e) => e.status === "Active").map((e) => <option key={e.id} value={e.id}>{e.name}</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={taskForm.start_date}
                      onChange={(e) => setTaskForm((p) => ({ ...p, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={taskForm.end_date}
                      onChange={(e) => setTaskForm((p) => ({ ...p, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {taskError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{taskError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowAddTask(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600">Batal</button>
                  <button
                    onClick={handleAddTask}
                    disabled={taskSaving || !taskForm.title.trim()}
                    className="flex items-center px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {taskSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Simpan Tugas
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada tugas. Klik <strong>Tambah Tugas</strong> untuk mulai.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium text-left">ID</th>
                      <th className="px-4 py-3 font-medium text-left">Judul</th>
                      <th className="px-4 py-3 font-medium text-left">Fase</th>
                      <th className="px-4 py-3 font-medium text-left">Prioritas</th>
                      <th className="px-4 py-3 font-medium text-left">Assignee</th>
                      <th className="px-4 py-3 font-medium text-left">Mulai</th>
                      <th className="px-4 py-3 font-medium text-left">Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => {
                      const phase = phases.find((p) => p.id === task.phase_id);
                      return (
                        <tr key={task.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-xs text-slate-400 font-mono">{task.id}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                          <td className="px-4 py-3 text-slate-600">{phase?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_COLORS[task.priority] ?? "bg-slate-100 text-slate-600"}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{task.assignee || <span className="text-slate-300">—</span>}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {task.start_date
                              ? new Date(task.start_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {task.end_date
                              ? new Date(task.end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                              : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] ?? "bg-slate-100 text-slate-600"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MemberRow({
  member, removing, onRemove,
}: {
  member: ApiProjectMember; removing: boolean; onRemove: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
            {(member.employee_name ?? "?")[0].toUpperCase()}
          </div>
          <span className="font-medium text-slate-900">{member.employee_name ?? member.employee_id}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{member.employee_position ?? "—"}</td>
      <td className="px-4 py-3 text-slate-500 text-xs">{member.employee_organization ?? "—"}</td>
      <td className="px-4 py-3 text-slate-400 text-xs">
        {new Date(member.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-red-400 hover:text-red-600 p-1 rounded disabled:opacity-50"
          title="Hapus dari proyek"
        >
          {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}
