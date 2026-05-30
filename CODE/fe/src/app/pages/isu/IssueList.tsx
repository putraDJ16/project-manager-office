import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useNavigate, useSearchParams } from "react-router";
import {
  ExternalLink,
  FileWarning,
  Filter,
  KanbanSquare,
  List,
  Loader2,
  Paperclip,
  Search,
  Settings2,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type { Employee } from "../../data/masterData";
import {
  ISSUE_SEVERITY_ORDER,
  ISSUE_STATUS_ORDER,
  type Issue,
  type IssueSeverity,
  type IssueStatus,
  type SlaConfig,
  type SlaRule
} from "../../domain/issues";
import {
  createIssue,
  escalateIssue,
  getIssues,
  getSlaConfig,
  updateIssueStatus,
  updateSlaConfig
} from "../../services/issueService";
import { fetchEmployees } from "../../services/masterApi";
import { fetchProjects, type ApiProject } from "../../services/projectApi";
import {
  getSlaIndicator,
  shouldAutoEscalate,
  type SlaIndicatorTone
} from "../../services/issueSla";
import { PaginationControls } from "../../components/ui";
import { loadAuthSession } from "../../data/auth";
import { hasPermission } from "../../utils/permissions";

type ViewMode = "list" | "board";
type RuleDraft = { targetHours: string; autoEscalate: boolean; escalationDelayMinutes: string };
type RuleDraftMap = Record<IssueSeverity, RuleDraft>;
const PAGE_SIZE = 10;

type CreateIssueFormState = {
  projectId: string;
  title: string;
  severity: IssueSeverity;
  assignee: string;
  module: string;
  environment: string;
  description: string;
  reproductionSteps: string;
  actualResult: string;
  expectedResult: string;
};

function getDefaultCreateForm(defaultProjectId = ""): CreateIssueFormState {
  return {
    projectId: defaultProjectId,
    title: "",
    severity: "Major",
    assignee: "",
    module: "",
    environment: "",
    description: "",
    reproductionSteps: "",
    actualResult: "",
    expectedResult: ""
  };
}

export function IssueList() {
  const navigate = useNavigate();
  const session = loadAuthSession();
  const canCreateIssue = hasPermission(session, "issues", "create");
  const reporterName = session?.employeeName?.trim() || session?.name?.trim() || "";
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [slaConfig, setSlaConfig] = useState<SlaConfig | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [createForm, setCreateForm] = useState<CreateIssueFormState>(() => getDefaultCreateForm());
  const [slaDraft, setSlaDraft] = useState<RuleDraftMap | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isSubmittingSla, setIsSubmittingSla] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const defaultProjectId = projects[0]?.id ?? "";

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (searchParams.get("create") !== "issue" || !canCreateIssue) return;
    setCreateForm((current) => (current.projectId ? current : getDefaultCreateForm(defaultProjectId)));
    setIsCreateModalOpen(true);
  }, [canCreateIssue, defaultProjectId, searchParams]);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      const [fetchedIssues, fetchedSla, fetchedProjects, fetchedEmployees] = await Promise.all([
        getIssues(),
        getSlaConfig(),
        fetchProjects(),
        fetchEmployees()
      ]);
      if (isCancelled) return;

      setIssues(fetchedIssues);
      setSlaConfig(fetchedSla);
      setSlaDraft(buildRuleDraftMap(fetchedSla));
      setProjects(fetchedProjects);
      setEmployees(fetchedEmployees.filter((employee) => employee.status === "Active"));
      setCreateForm((current) =>
        current.projectId ? current : getDefaultCreateForm(fetchedProjects[0]?.id ?? "")
      );
      setIsLoading(false);
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slaConfig) return;

    let isCancelled = false;

    const syncAutoEscalation = async () => {
      const currentIssues = await getIssues();
      if (isCancelled) return;

      const overdueIssues = currentIssues.filter((issue) => shouldAutoEscalate(issue, slaConfig));
      if (overdueIssues.length === 0) {
        setIssues(currentIssues);
        return;
      }

      await Promise.all(overdueIssues.map((issue) => escalateIssue(issue.id)));
      if (isCancelled) return;

      const refreshed = await getIssues();
      if (isCancelled) return;

      setIssues(refreshed);
      setNotice(`${overdueIssues.length} isu otomatis dieskalasi karena melebihi SLA.`);
    };

    void syncAutoEscalation();
    const interval = window.setInterval(() => {
      void syncAutoEscalation();
    }, 60000);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [slaConfig]);

  const projectById = useMemo(() => {
    return projects.reduce<Record<string, string>>((acc, project) => {
      acc[project.id] = project.name;
      return acc;
    }, {});
  }, [projects]);

  const getProjectName = (projectId: string) => projectById[projectId] ?? projectId;

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return issues.filter((issue) => {
      if (severityFilter !== "all" && issue.severity !== severityFilter) {
        return false;
      }

      if (statusFilter !== "all" && issue.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const source = `${issue.id} ${issue.title} ${issue.reporter} ${issue.assignee ?? ""} ${issue.status} ${issue.severity} ${getProjectName(issue.projectId)}`.toLowerCase();
      return source.includes(query);
    });
  }, [issues, searchQuery, severityFilter, statusFilter, projectById]);
  const paginatedIssues = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, page]);
  const hasSearchInput = searchInput.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, severityFilter, statusFilter, view]);

  const visibleStatuses = useMemo(() => {
    if (statusFilter === "all") return ISSUE_STATUS_ORDER;
    return [statusFilter];
  }, [statusFilter]);

  const handleCreateIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateIssue) {
      setNotice("Anda tidak memiliki izin untuk membuat isu baru.");
      setIsCreateModalOpen(false);
      return;
    }
    if (!reporterName) {
      setNotice("Pelapor tidak ditemukan dari sesi login. Silakan login ulang.");
      return;
    }

    setIsSubmittingIssue(true);
    try {
      await createIssue({
        projectId: createForm.projectId,
        title: createForm.title,
        severity: createForm.severity,
        reporter: reporterName,
        assignee: createForm.assignee || null,
        module: createForm.module,
        environment: createForm.environment,
        description: createForm.description,
        reproductionSteps: parseMultilineInput(createForm.reproductionSteps),
        actualResult: createForm.actualResult,
        expectedResult: createForm.expectedResult,
        attachments: selectedAttachments.map((file) => file.name)
      });

      const refreshed = await getIssues();
      setIssues(refreshed);
      setCreateForm(getDefaultCreateForm(defaultProjectId));
      setSelectedAttachments([]);
      setIsCreateModalOpen(false);
      setNotice("Isu baru berhasil dibuat.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal membuat isu baru.");
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    await updateIssueStatus(issueId, status);
    const refreshed = await getIssues();
    setIssues(refreshed);
  };

  const handleSlaDraftChange = (
    severity: IssueSeverity,
    key: "targetHours" | "escalationDelayMinutes",
    value: string
  ) => {
    if (!slaDraft) return;

    setSlaDraft({
      ...slaDraft,
      [severity]: {
        ...slaDraft[severity],
        [key]: value
      }
    });
  };

  const handleSlaSave = async () => {
    if (!slaDraft) return;

    const nextConfig: SlaConfig = {
      rules: ISSUE_SEVERITY_ORDER.map((severity) => ({
        severity,
        targetHours: Math.max(1, Number(slaDraft[severity].targetHours) || 1),
        autoEscalate: slaDraft[severity].autoEscalate,
        escalationDelayMinutes: Math.max(0, Number(slaDraft[severity].escalationDelayMinutes) || 0)
      }))
    };

    setIsSubmittingSla(true);
    try {
      const saved = await updateSlaConfig(nextConfig);
      setSlaConfig(saved);
      setSlaDraft(buildRuleDraftMap(saved));
      setIsSlaModalOpen(false);
      setNotice("Pengaturan SLA & eskalasi berhasil disimpan.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal menyimpan pengaturan SLA.");
    } finally {
      setIsSubmittingSla(false);
    }
  };

  const getIssueSlaInfo = (issue: Issue) => {
    if (!slaConfig) {
      return { label: "Memuat...", tone: "safe" as SlaIndicatorTone };
    }
    const indicator = getSlaIndicator(issue, slaConfig);
    return { label: indicator.label, tone: indicator.tone };
  };

  const handleAttachmentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setSelectedAttachments((current) => {
      const existingKeys = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const appended = files.filter(
        (file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
      );
      return [...current, ...appended];
    });

    event.target.value = "";
  };

  const removeAttachment = (targetIndex: number) => {
    setSelectedAttachments((current) => current.filter((_, index) => index !== targetIndex));
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Isu & Bug Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Lacak dan selesaikan masalah sistem sesuai Service Level Agreement (SLA).</p>
        </div>
        {canCreateIssue && (
          <button
            type="button"
            onClick={() => {
              setCreateForm(getDefaultCreateForm(defaultProjectId));
              setSelectedAttachments([]);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm transition-colors"
          >
            <FileWarning className="w-4 h-4 mr-2" /> Lapor Bug
          </button>
        )}
      </div>

      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200 w-full max-w-md">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center justify-center ${view === "list" ? "bg-slate-100 text-red-700" : "text-slate-600 hover:text-slate-900"}`}
          >
            <List className="w-4 h-4 mr-2" /> List
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center justify-center ${view === "board" ? "bg-slate-100 text-red-700" : "text-slate-600 hover:text-slate-900"}`}
          >
            <KanbanSquare className="w-4 h-4 mr-2" /> Board
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari bug ID atau judul..."
              className="pl-9 pr-10 py-1.5 w-64 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
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
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700">
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as IssueSeverity | "all")}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:border-red-500"
          >
            <option value="all">Severity: Semua</option>
            {ISSUE_SEVERITY_ORDER.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as IssueStatus | "all")}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:border-red-500"
        >
          <option value="all">Status: Semua</option>
          {ISSUE_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">{filteredIssues.length} isu</span>
          <button
            type="button"
            onClick={() => setIsSlaModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Settings2 className="w-4 h-4 mr-1.5" /> Pengaturan SLA & Eskalasi
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-6 pt-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto bg-slate-50/50 relative">
        {isLoading && (
          <div className="h-full rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-sm text-slate-500">
            Memuat data isu...
          </div>
        )}

        {!isLoading && view === "list" && (
          <div className="space-y-4">
            <IssueTable
              issues={paginatedIssues}
              getIssueSlaInfo={getIssueSlaInfo}
              getProjectName={getProjectName}
              onRowClick={(id) => navigate(`/isu/${id}`)}
            />
            <div className="rounded-xl border border-slate-200 bg-white">
              <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredIssues.length} onPageChange={setPage} />
            </div>
          </div>
        )}

        {!isLoading && view === "board" && (
          <IssueBoard
            issues={filteredIssues}
            statuses={visibleStatuses}
            getIssueSlaInfo={getIssueSlaInfo}
            getProjectName={getProjectName}
            onIssueClick={(id) => navigate(`/isu/${id}`)}
            onMoveIssue={(id, status) => void handleStatusChange(id, status)}
          />
        )}
      </div>

      {isCreateModalOpen && canCreateIssue && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            if (isSubmittingIssue) return;
            setSelectedAttachments([]);
            setIsCreateModalOpen(false);
          }}
        >
          <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Lapor Bug Baru</h2>
              <button
                type="button"
                disabled={isSubmittingIssue}
                onClick={() => {
                  setSelectedAttachments([]);
                  setIsCreateModalOpen(false);
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Isu</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Contoh: Gagal upload lampiran pada tiket"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Proyek</label>
                  <select
                    value={createForm.projectId}
                    onChange={(event) => setCreateForm((current) => ({ ...current, projectId: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={createForm.severity}
                    onChange={(event) => setCreateForm((current) => ({ ...current, severity: event.target.value as IssueSeverity }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    {ISSUE_SEVERITY_ORDER.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
                <select
                  value={createForm.assignee ?? ""}
                  onChange={(event) => setCreateForm((current) => ({ ...current, assignee: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.name}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Modul</label>
                  <input
                    type="text"
                    value={createForm.module}
                    onChange={(event) => setCreateForm((current) => ({ ...current, module: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: Auth Gateway v2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Environment</label>
                  <input
                    type="text"
                    value={createForm.environment}
                    onChange={(event) => setCreateForm((current) => ({ ...current, environment: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: Production / Win11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={4}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Jelaskan kronologi bug secara singkat..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Langkah Reproduksi</label>
                <textarea
                  rows={4}
                  value={createForm.reproductionSteps}
                  onChange={(event) => setCreateForm((current) => ({ ...current, reproductionSteps: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={"Tulis satu langkah per baris.\nContoh:\nBuka halaman login\nKlik tombol masuk"}
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Actual Result</label>
                  <textarea
                    rows={3}
                    value={createForm.actualResult}
                    onChange={(event) => setCreateForm((current) => ({ ...current, actualResult: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Hasil aktual saat bug terjadi"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Result</label>
                  <textarea
                    rows={3}
                    value={createForm.expectedResult}
                    onChange={(event) => setCreateForm((current) => ({ ...current, expectedResult: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Hasil yang seharusnya"
                    required
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lampiran Bukti</label>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  onChange={handleAttachmentInputChange}
                  className="hidden"
                />

                <div className="rounded-lg border border-slate-300 bg-slate-50/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      <Upload className="w-4 h-4 mr-1.5" />
                      Browse File
                    </button>
                    <span className="text-xs text-slate-500">Bisa upload multiple file sekaligus.</span>
                    {selectedAttachments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedAttachments([])}
                        className="ml-auto inline-flex items-center px-2.5 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus Semua
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedAttachments.length === 0 && (
                      <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-2 bg-white">
                        Belum ada file dipilih.
                      </div>
                    )}

                    {selectedAttachments.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingIssue}
                  onClick={() => {
                    setSelectedAttachments([]);
                    setIsCreateModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {isSubmittingIssue && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  {isSubmittingIssue ? "Menyimpan..." : "Simpan Isu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSlaModalOpen && slaDraft && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSubmittingSla) setIsSlaModalOpen(false);
          }}
        >
          <div className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Pengaturan SLA & Eskalasi</h2>
              <button
                type="button"
                onClick={() => setIsSlaModalOpen(false)}
                disabled={isSubmittingSla}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Severity</th>
                      <th className="px-4 py-3 text-left font-medium">Target SLA (jam)</th>
                      <th className="px-4 py-3 text-left font-medium">Auto Eskalasi</th>
                      <th className="px-4 py-3 text-left font-medium">Delay Eskalasi (menit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ISSUE_SEVERITY_ORDER.map((severity) => (
                      <tr key={severity}>
                        <td className="px-4 py-3 font-semibold text-slate-800">{severity}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={1}
                            value={slaDraft[severity].targetHours}
                            onChange={(event) => handleSlaDraftChange(severity, "targetHours", event.target.value)}
                            className="w-28 border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slaDraft[severity].autoEscalate}
                              onChange={(event) =>
                                setSlaDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        [severity]: {
                                          ...current[severity],
                                          autoEscalate: event.target.checked
                                        }
                                      }
                                    : current
                                )
                              }
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">Aktif</span>
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            value={slaDraft[severity].escalationDelayMinutes}
                            onChange={(event) => handleSlaDraftChange(severity, "escalationDelayMinutes", event.target.value)}
                            className="w-32 border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setIsSlaModalOpen(false)}
                  disabled={isSubmittingSla}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void handleSlaSave()}
                  disabled={isSubmittingSla}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSubmittingSla && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  {isSubmittingSla ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueTable({
  issues,
  onRowClick,
  getIssueSlaInfo,
  getProjectName
}: {
  issues: Issue[];
  onRowClick: (id: string) => void;
  getIssueSlaInfo: (issue: Issue) => { label: string; tone: SlaIndicatorTone };
  getProjectName: (projectId: string) => string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] bg-white">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 font-medium">ID Bug</th>
            <th className="px-4 py-3 font-medium">Judul Isu</th>
            <th className="px-4 py-3 font-medium">Proyek</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">SLA</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {issues.map((issue) => {
            const sla = getIssueSlaInfo(issue);
            return (
              <tr
                key={issue.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onRowClick(issue.id)}
              >
                <td className="px-4 py-3 text-slate-500 font-bold">{issue.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{issue.title}</td>
                <td className="px-4 py-3 text-slate-700">{getProjectName(issue.projectId)}</td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={issue.severity} />
                </td>
                <td className="px-4 py-3 text-slate-600">{issue.status}</td>
                <td className="px-4 py-3">
                  <SlaBadge label={sla.label} tone={sla.tone} />
                </td>
                <td className="px-4 py-3 text-slate-600">{issue.assignee ?? "Unassigned"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-indigo-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRowClick(issue.id);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </button>
                </td>
              </tr>
            );
          })}

          {issues.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                Tidak ada isu yang sesuai filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IssueBoard({
  issues,
  statuses,
  onIssueClick,
  onMoveIssue,
  getIssueSlaInfo,
  getProjectName
}: {
  issues: Issue[];
  statuses: readonly IssueStatus[];
  onIssueClick: (id: string) => void;
  onMoveIssue: (id: string, status: IssueStatus) => void;
  getIssueSlaInfo: (issue: Issue) => { label: string; tone: SlaIndicatorTone };
  getProjectName: (projectId: string) => string;
}) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const destinationStatus = result.destination.droppableId as IssueStatus;
    const issueId = result.draggableId;
    const issue = issues.find((entry) => entry.id === issueId);
    if (!issue || issue.status === destinationStatus) return;
    onMoveIssue(issueId, destinationStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {statuses.map((status) => {
          const columnIssues = issues.filter((issue) => issue.status === status);

          return (
            <div key={status} className="w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200">
              <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                <h3 className="font-semibold text-slate-800 text-sm">{status}</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{columnIssues.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[220px]">
                    {columnIssues.map((issue, index) => {
                      const sla = getIssueSlaInfo(issue);
                      return (
                        <Draggable key={issue.id} draggableId={issue.id} index={index}>
                          {(draggableProvided) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              onClick={() => onIssueClick(issue.id)}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-red-300 transition-all"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-slate-400">{issue.id}</span>
                                <SeverityBadge severity={issue.severity} />
                              </div>
                              <h4 className="font-medium text-slate-900 mb-3 text-sm leading-snug">{issue.title}</h4>
                              <div className="mb-2 text-xs text-slate-500">Proyek: {getProjectName(issue.projectId)}</div>
                              <div className="mb-2">
                                <SlaBadge label={sla.label} tone={sla.tone} />
                              </div>
                              <div className="text-xs text-slate-500">Assignee: {issue.assignee ?? "Unassigned"}</div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {columnIssues.length === 0 && (
                      <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-2 bg-white/60">
                        Tidak ada isu di status ini.
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const styles: Record<IssueSeverity, string> = {
    Blocker: "bg-red-900 text-red-50 border-red-950",
    Critical: "bg-red-600 text-white border-red-700",
    Major: "bg-orange-500 text-white border-orange-600",
    Minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Trivial: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded shadow-sm border ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function SlaBadge({ label, tone }: { label: string; tone: SlaIndicatorTone }) {
  const toneClass: Record<SlaIndicatorTone, string> = {
    safe: "text-emerald-700 bg-emerald-100 border-emerald-200",
    warning: "text-amber-700 bg-amber-100 border-amber-200 font-semibold",
    breached: "text-red-700 bg-red-100 border-red-200 font-bold",
    resolved: "text-slate-700 bg-slate-100 border-slate-200"
  };

  return <span className={`inline-flex px-2 py-0.5 text-xs rounded-md border ${toneClass[tone]}`}>{label}</span>;
}

function parseMultilineInput(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildRuleDraftMap(config: SlaConfig): RuleDraftMap {
  const bySeverity = config.rules.reduce<Record<IssueSeverity, SlaRule>>((acc, rule) => {
    acc[rule.severity] = rule;
    return acc;
  }, {} as Record<IssueSeverity, SlaRule>);

  return {
    Blocker: toRuleDraft(bySeverity.Blocker),
    Critical: toRuleDraft(bySeverity.Critical),
    Major: toRuleDraft(bySeverity.Major),
    Minor: toRuleDraft(bySeverity.Minor),
    Trivial: toRuleDraft(bySeverity.Trivial)
  };
}

function toRuleDraft(rule: SlaRule): RuleDraft {
  return {
    targetHours: String(rule.targetHours),
    autoEscalate: rule.autoEscalate,
    escalationDelayMinutes: String(rule.escalationDelayMinutes)
  };
}


