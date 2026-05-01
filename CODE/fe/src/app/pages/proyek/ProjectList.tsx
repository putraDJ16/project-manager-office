import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Search, Plus, Filter, LayoutGrid, List, MoreVertical, FolderKanban,
  Activity, Calendar, Users, X, ChevronRight, ChevronLeft, Loader2,
  AlertCircle, Trash2
} from "lucide-react";
import { fetchProjects, createProject, type ApiProject, type RasciAssignment } from "../../services/projectApi";
import { fetchEmployees } from "../../services/masterApi";
import type { Employee } from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import { hasPermission } from "../../utils/permissions";

const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Completed"];
const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Planning: "bg-blue-50 text-blue-700 border-blue-200",
  "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-slate-50 text-slate-600 border-slate-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Low: "bg-green-50 text-green-700 border-green-200",
};

type PhaseInput = { name: string };

type RasciListKey = "responsible_ids" | "support_ids" | "consulted_ids" | "informed_ids";
type RasciSingleKey = "accountable_id";

type RasciForm = {
  responsible_ids: string[];
  accountable_id: string;
  support_ids: string[];
  consulted_ids: string[];
  informed_ids: string[];
};

type CreateForm = {
  name: string;
  description: string;
  status: string;
  priority: string;
  rasci: RasciForm;
  start_date: string;
  end_date: string;
  phases: PhaseInput[];
};

type RasciField =
  | { key: RasciListKey; code: string; label: string; multiple: true }
  | { key: RasciSingleKey; code: string; label: string; multiple: false };

const RASCI_FIELDS: RasciField[] = [
  { key: "responsible_ids", code: "R", label: "Responsible", multiple: true },
  { key: "accountable_id", code: "A", label: "Accountable", multiple: false },
  { key: "support_ids", code: "S", label: "Support", multiple: true },
  { key: "consulted_ids", code: "C", label: "Consulted", multiple: true },
  { key: "informed_ids", code: "I", label: "Informed", multiple: true },
];

const createEmptyForm = (): CreateForm => ({
  name: "",
  description: "",
  status: "Planning",
  priority: "",
  rasci: {
    responsible_ids: [],
    accountable_id: "",
    support_ids: [],
    consulted_ids: [],
    informed_ids: [],
  },
  start_date: "",
  end_date: "",
  phases: [{ name: "" }],
});

const buildRasciPayload = (rasci: RasciForm): RasciAssignment => ({
  responsible: rasci.responsible_ids,
  accountable: rasci.accountable_id || null,
  support: rasci.support_ids,
  consulted: rasci.consulted_ids,
  informed: rasci.informed_ids,
});

export function ProjectList() {
  const navigate = useNavigate();
  const session = loadAuthSession();
  const canCreateProject = hasPermission(session, "masterProjects", "create");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CreateForm>(createEmptyForm);
  const [rasciOrganizationFilter, setRasciOrganizationFilter] = useState("");
  const [rasciSearch, setRasciSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProjects(), fetchEmployees()])
      .then(([projs, emps]) => {
        setProjects(projs);
        setEmployees(emps);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      `${p.id} ${p.name} ${p.status} ${p.priority ?? ""} ${p.manager_name ?? ""}`.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === "Active"), [employees]);

  const employeeById = useMemo(
    () => activeEmployees.reduce<Record<string, Employee>>((acc, employee) => ({ ...acc, [employee.id]: employee }), {}),
    [activeEmployees]
  );

  const rasciOrganizations = useMemo(
    () => Array.from(new Set(activeEmployees.map((employee) => employee.organization).filter(Boolean))).sort(),
    [activeEmployees]
  );

  const filteredRasciEmployees = useMemo(() => {
    const query = rasciSearch.trim().toLowerCase();
    return activeEmployees.filter((employee) => {
      const matchesOrganization = !rasciOrganizationFilter || employee.organization === rasciOrganizationFilter;
      const searchable = `${employee.name} ${employee.nip} ${employee.email} ${employee.position} ${employee.organization}`.toLowerCase();
      return matchesOrganization && (!query || searchable.includes(query));
    });
  }, [activeEmployees, rasciOrganizationFilter, rasciSearch]);

  const getRasciOptions = (field: RasciField) => {
    const selectedValue = form.rasci[field.key];
    const selectedIds = Array.isArray(selectedValue) ? selectedValue : selectedValue ? [selectedValue] : [];
    if (field.multiple) {
      return filteredRasciEmployees.filter((employee) => !selectedIds.includes(employee.id));
    }
    const selectedId = selectedIds[0];
    if (!selectedId || filteredRasciEmployees.some((employee) => employee.id === selectedId)) {
      return filteredRasciEmployees;
    }
    const selectedEmployee = activeEmployees.find((employee) => employee.id === selectedId);
    return selectedEmployee ? [selectedEmployee, ...filteredRasciEmployees] : filteredRasciEmployees;
  };

  const addRasciEmployee = (fieldKey: RasciListKey, employeeId: string) => {
    if (!employeeId) return;
    setForm((previous) => {
      const selectedIds = previous.rasci[fieldKey];
      if (selectedIds.includes(employeeId)) return previous;
      return {
        ...previous,
        rasci: { ...previous.rasci, [fieldKey]: [...selectedIds, employeeId] },
      };
    });
  };

  const removeRasciEmployee = (fieldKey: RasciListKey, employeeId: string) => {
    setForm((previous) => ({
      ...previous,
      rasci: {
        ...previous.rasci,
        [fieldKey]: previous.rasci[fieldKey].filter((selectedId) => selectedId !== employeeId),
      },
    }));
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const openModal = () => {
    if (!canCreateProject) return;
    setForm(createEmptyForm());
    setModalStep(1);
    setRasciOrganizationFilter("");
    setRasciSearch("");
    setSaveError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSaveError(null);
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setModalStep(2);
  };

  const addPhaseRow = () =>
    setForm((prev) => ({ ...prev, phases: [...prev.phases, { name: "" }] }));

  const removePhaseRow = (index: number) =>
    setForm((prev) => ({ ...prev, phases: prev.phases.filter((_, i) => i !== index) }));

  const updatePhase = (index: number, value: string) =>
    setForm((prev) => {
      const phases = [...prev.phases];
      phases[index] = { name: value };
      return { ...prev, phases };
    });

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const phases = form.phases.filter((p) => p.name.trim());
      const rasci = buildRasciPayload(form.rasci);
      const result = await createProject({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority || undefined,
        manager_id: rasci.accountable || undefined,
        rasci,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        phases: phases.length ? phases : undefined,
      });
      setProjects((prev) => [result.data, ...prev]);
      closeModal();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Proyek</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Semua Proyek</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portofolio Proyek</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${view === "grid" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${view === "list" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}
            >
              <List className="w-4 h-4 mr-2" /> List
            </button>
          </div>
          {canCreateProject && (
            <>
              <div className="w-px h-6 bg-slate-300 mx-1" />
              <button
                onClick={openModal}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Proyek Baru
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari proyek..."
              className="pl-9 pr-10 py-1.5 w-64 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Cari
          </button>
        </form>
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat data...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24 text-red-500 gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {canCreateProject ? (
                <>
                  Belum ada proyek. Klik <strong>Proyek Baru</strong> untuk mulai.
                </>
              ) : (
                "Belum ada proyek yang dapat ditampilkan."
              )}
            </p>
          </div>
        ) : view === "grid" ? (
          <GridView projects={filteredProjects} onOpen={(id) => navigate(`/proyek/${id}`)} />
        ) : (
          <ListView projects={filteredProjects} onOpen={(id) => navigate(`/proyek/${id}`)} />
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Buat Proyek Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Langkah {modalStep} dari 3 - {modalStep === 1 ? "Informasi Proyek" : modalStep === 2 ? "RASCI" : "Fase Proyek"}
                </p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${modalStep >= 1 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>1</div>
              <div className={`flex-1 h-1 rounded-full ${modalStep >= 2 ? "bg-indigo-600" : "bg-slate-200"}`} />
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${modalStep >= 2 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
              <div className={`flex-1 h-1 rounded-full ${modalStep >= 3 ? "bg-indigo-600" : "bg-slate-200"}`} />
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${modalStep >= 3 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"}`}>3</div>
            </div>

            {/* Step 1: Project Info */}
            {modalStep === 1 && (
              <form onSubmit={handleStep1Next} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Proyek <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Contoh: Sistem Informasi Kepegawaian"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Jelaskan tujuan dan ruang lingkup proyek..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Pilih Prioritas —</option>
                      {PROJECT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Berikutnya <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: RASCI */}
            {modalStep === 2 && (
              <div className="px-6 py-5">
                <div className="mb-4 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                  <span className="font-semibold">RASCI</span> memetakan peran kerja: Responsible mengerjakan,
                  Accountable bertanggung jawab akhir, Support membantu eksekusi, Consulted memberi masukan, dan
                  Informed menerima informasi perkembangan.
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organisasi</label>
                    <select
                      value={rasciOrganizationFilter}
                      onChange={(event) => setRasciOrganizationFilter(event.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Semua organisasi</option>
                      {rasciOrganizations.map((organization) => (
                        <option key={organization} value={organization}>
                          {organization}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cari Pegawai</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={rasciSearch}
                        onChange={(event) => setRasciSearch(event.target.value)}
                        placeholder="Nama, NIP, email, atau jabatan"
                        className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {rasciSearch && (
                        <button
                          type="button"
                          onClick={() => setRasciSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {RASCI_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-indigo-700 shadow-sm">
                        {field.code}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 block text-xs font-medium text-slate-600">{field.label}</span>
                        {field.multiple ? (
                          <>
                            <select
                              value=""
                              onChange={(event) => addRasciEmployee(field.key, event.target.value)}
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Pilih pegawai</option>
                              {getRasciOptions(field).map((employee) => (
                                <option key={`${field.key}-${employee.id}`} value={employee.id}>
                                  {employee.name} - {employee.position}
                                </option>
                              ))}
                            </select>
                            {form.rasci[field.key].length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {form.rasci[field.key].map((employeeId) => {
                                  const employee = employeeById[employeeId];
                                  return (
                                    <span
                                      key={`${field.key}-selected-${employeeId}`}
                                      className="inline-flex max-w-full items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                                    >
                                      <span className="truncate">{employee?.name ?? employeeId}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeRasciEmployee(field.key, employeeId)}
                                        className="rounded text-indigo-500 hover:bg-indigo-100 hover:text-indigo-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <select
                            value={form.rasci[field.key]}
                            onChange={(event) =>
                              setForm((previous) => ({
                                ...previous,
                                rasci: { ...previous.rasci, [field.key]: event.target.value },
                              }))
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Pilih pegawai</option>
                            {getRasciOptions(field).map((employee) => (
                              <option key={`${field.key}-${employee.id}`} value={employee.id}>
                                {employee.name} - {employee.position}
                              </option>
                            ))}
                          </select>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-5">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Berikutnya <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Phases */}
            {modalStep === 3 && (
              <div className="px-6 py-5">
                <p className="text-sm text-slate-600 mb-4">
                  Tambahkan fase-fase proyek (opsional). Anda bisa menambah lebih banyak fase setelah proyek dibuat.
                </p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {form.phases.map((phase, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right shrink-0">{index + 1}.</span>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(index, e.target.value)}
                        placeholder={`Nama fase ${index + 1}, misal: Inisiasi`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {form.phases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhaseRow(index)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPhaseRow}
                  className="mt-3 flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Fase
                </button>

                {saveError && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-5 py-2 bg-slate-600 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Lewati & Simpan
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-5 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Simpan Proyek
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GridView({ projects, onOpen }: { projects: ApiProject[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: ApiProject; onOpen: (id: string) => void }) {
  return (
    <div
      onClick={() => onOpen(project.id)}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col justify-between h-auto"
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <h3 className="font-semibold text-slate-900 text-base line-clamp-2 mb-1">{project.name}</h3>
        {project.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2">{project.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_COLORS[project.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
            <Activity className="w-3 h-3 mr-1 mt-px" />{project.status}
          </span>
          {project.priority && (
            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${PRIORITY_COLORS[project.priority] ?? ""}`}>
              {project.priority}
            </span>
          )}
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.member_count}</span>
          <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" />{project.task_count} tugas</span>
        </div>
        {project.end_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(project.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

function ListView({ projects, onOpen }: { projects: ApiProject[]; onOpen: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-medium">Nama Proyek</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Prioritas</th>
            <th className="px-6 py-4 font-medium">Manajer</th>
            <th className="px-6 py-4 font-medium">Anggota</th>
            <th className="px-6 py-4 font-medium">Tugas</th>
            <th className="px-6 py-4 font-medium">Tenggat</th>
            <th className="px-6 py-4 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onOpen(project.id)}>
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">{project.name}</span>
                    {project.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{project.description}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${STATUS_COLORS[project.status] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4">
                {project.priority ? (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${PRIORITY_COLORS[project.priority] ?? ""}`}>
                    {project.priority}
                  </span>
                ) : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-6 py-4 text-slate-600">{project.manager_name ?? <span className="text-slate-300">—</span>}</td>
              <td className="px-6 py-4 text-slate-600">{project.member_count}</td>
              <td className="px-6 py-4 text-slate-600">{project.task_count}</td>
              <td className="px-6 py-4 text-slate-600">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpen(project.id); }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                >
                  Lihat Detail →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
