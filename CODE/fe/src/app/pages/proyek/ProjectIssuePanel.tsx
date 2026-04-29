import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { FileWarning, KanbanSquare, List, Paperclip, Search, X } from "lucide-react";
import {
  ISSUE_SEVERITY_ORDER,
  ISSUE_STATUS_ORDER,
  type CreateIssueInput,
  type Issue,
  type IssueSeverity,
  type IssueStatus,
  type SlaConfig
} from "../../domain/issues";
import {
  createIssue,
  escalateIssue,
  getIssues,
  getSlaConfig,
  updateIssueStatus
} from "../../services/issueService";
import { getSlaIndicator, shouldAutoEscalate, type SlaIndicatorTone } from "../../services/issueSla";
import { loadAuthSession } from "../../data/auth";
import { uploadAttachmentFile } from "../../services/projectAttachmentApi";
import { IssueDetailPanel } from "../isu/IssueDetailPanel";

type ViewMode = "list" | "board";

type CreateIssueFormState = {
  title: string;
  severity: IssueSeverity;
  reporter: string;
  assignee: string;
  module: string;
  environment: string;
  description: string;
  reproductionSteps: string;
  actualResult: string;
  expectedResult: string;
};

type ProjectIssuePanelProps = {
  projectId: string;
  projectName: string;
  assigneeOptions: string[];
  canCreate: boolean;
  canEdit: boolean;
  canUploadAttachment: boolean;
  onNotice: (notice: { type: "success" | "error"; msg: string }) => void;
};

function getDefaultCreateForm(defaultReporter = ""): CreateIssueFormState {
  return {
    title: "",
    severity: "Major",
    reporter: defaultReporter,
    assignee: "",
    module: "",
    environment: "",
    description: "",
    reproductionSteps: "",
    actualResult: "",
    expectedResult: ""
  };
}

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function ProjectIssuePanel({
  projectId,
  projectName,
  assigneeOptions,
  canCreate,
  canEdit,
  canUploadAttachment,
  onNotice
}: ProjectIssuePanelProps) {
  const reporterName = useMemo(() => loadAuthSession()?.name ?? "System", []);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [slaConfig, setSlaConfig] = useState<SlaConfig | null>(null);
  const [view, setView] = useState<ViewMode>("list");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateIssueFormState>(() => getDefaultCreateForm(reporterName));
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedIssues, fetchedSla] = await Promise.all([getIssues(projectId), getSlaConfig()]);
        if (isCancelled) return;
        setIssues(fetchedIssues);
        setSlaConfig(fetchedSla);
      } catch (error) {
        if (isCancelled) return;
        onNotice({
          type: "error",
          msg: error instanceof Error ? error.message : "Gagal memuat data isu proyek."
        });
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      isCancelled = true;
    };
  }, [projectId, onNotice]);

  useEffect(() => {
    if (!slaConfig) return;
    let isCancelled = false;

    const syncAutoEscalation = async () => {
      const currentIssues = await getIssues(projectId);
      if (isCancelled) return;

      const overdueIssues = currentIssues.filter((issue) => shouldAutoEscalate(issue, slaConfig));
      if (overdueIssues.length === 0) {
        setIssues(currentIssues);
        return;
      }

      await Promise.all(overdueIssues.map((issue) => escalateIssue(issue.id)));
      if (isCancelled) return;

      const refreshed = await getIssues(projectId);
      if (isCancelled) return;

      setIssues(refreshed);
      onNotice({ type: "success", msg: `${overdueIssues.length} isu otomatis dieskalasi oleh SLA.` });
    };

    void syncAutoEscalation();
    const interval = window.setInterval(() => {
      void syncAutoEscalation();
    }, 60000);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [projectId, slaConfig, onNotice]);

  useEffect(() => {
    if (!selectedIssueId) return;
    if (!issues.some((issue) => issue.id === selectedIssueId)) {
      setSelectedIssueId(null);
    }
  }, [issues, selectedIssueId]);

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === selectedIssueId) ?? null,
    [issues, selectedIssueId]
  );

  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      if (!query) return true;
      const source = `${issue.id} ${issue.title} ${issue.reporter} ${issue.assignee ?? ""} ${issue.status} ${issue.severity}`.toLowerCase();
      return source.includes(query);
    });
  }, [issues, searchQuery, severityFilter, statusFilter]);

  const visibleStatuses = useMemo(() => {
    if (statusFilter === "all") return ISSUE_STATUS_ORDER;
    return [statusFilter];
  }, [statusFilter]);

  const getIssueSlaInfo = (issue: Issue) => {
    if (!slaConfig) return { label: "Memuat...", tone: "safe" as SlaIndicatorTone };
    const indicator = getSlaIndicator(issue, slaConfig);
    return { label: indicator.label, tone: indicator.tone };
  };

  const refreshIssues = async () => {
    const refreshed = await getIssues(projectId);
    setIssues(refreshed);
  };

  const handleCreateIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateIssueInput = {
        projectId,
        title: createForm.title,
        severity: createForm.severity,
        reporter: reporterName,
        assignee: createForm.assignee || null,
        module: createForm.module,
        environment: createForm.environment,
        description: createForm.description,
        reproductionSteps: parseLines(createForm.reproductionSteps),
        actualResult: createForm.actualResult,
        expectedResult: createForm.expectedResult,
        attachments: []
      };
      if (selectedAttachments.length > 0) {
        if (!canUploadAttachment) {
          onNotice({ type: "error", msg: "Role Anda belum memiliki izin upload lampiran." });
          return;
        }
        const uploadedFiles = await Promise.all(
          selectedAttachments.map((file) =>
            uploadAttachmentFile(projectId, {
              file,
              description: `Lampiran isu: ${createForm.title.trim() || "Issue"}`
            })
          )
        );
        payload.attachments = uploadedFiles.map((item) => item.data.original_name);
      }
      await createIssue(payload);
      await refreshIssues();
      setCreateForm(getDefaultCreateForm(reporterName));
      setSelectedAttachments([]);
      setIsCreateModalOpen(false);
      onNotice({ type: "success", msg: "Isu baru berhasil dibuat." });
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal membuat isu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    if (!canEdit) return;
    try {
      await updateIssueStatus(issueId, status);
      await refreshIssues();
    } catch (error) {
      onNotice({
        type: "error",
        msg: error instanceof Error ? error.message : "Gagal memperbarui status isu."
      });
    }
  };

  const handleEscalate = async (issueId: string) => {
    if (!canEdit) return;
    try {
      await escalateIssue(issueId);
      await refreshIssues();
      onNotice({ type: "success", msg: `Isu ${issueId} berhasil dieskalasi.` });
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal eskalasi isu." });
    }
  };

  const handleBoardDragEnd = (result: DropResult) => {
    if (!canEdit) return;
    if (!result.destination) return;
    const destinationStatus = result.destination.droppableId as IssueStatus;
    const issueId = result.draggableId;
    const issue = filteredIssues.find((entry) => entry.id === issueId);
    if (!issue || issue.status === destinationStatus) return;
    void handleStatusChange(issueId, destinationStatus);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Isu & Bug Proyek</h3>
          <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
                view === "list" ? "bg-slate-100 text-red-700" : "text-slate-600"
              }`}
            >
              <List className="w-4 h-4 mr-1.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
                view === "board" ? "bg-slate-100 text-red-700" : "text-slate-600"
              }`}
            >
              <KanbanSquare className="w-4 h-4 mr-1.5" /> Board
            </button>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setCreateForm(getDefaultCreateForm(reporterName));
              setSelectedAttachments([]);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            <FileWarning className="w-4 h-4 mr-1.5" /> Lapor Bug
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3 flex-wrap">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearchQuery(searchInput);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari ID/judul isu..."
              className="pl-9 pr-8 py-1.5 w-64 border border-slate-300 rounded-md text-sm"
            />
            {searchInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md">
            Cari
          </button>
        </form>

        <select
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value as IssueSeverity | "all")}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Severity: Semua</option>
          {ISSUE_SEVERITY_ORDER.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as IssueStatus | "all")}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Status: Semua</option>
          {ISSUE_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs font-medium text-slate-500">{filteredIssues.length} isu</div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Memuat data isu proyek...
        </div>
      ) : view === "list" ? (
        <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.map((issue) => {
                const sla = getIssueSlaInfo(issue);
                return (
                  <tr key={issue.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-bold">{issue.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{issue.title}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{issue.status}</td>
                    <td className="px-4 py-3">
                      <SlaBadge label={sla.label} tone={sla.tone} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{issue.assignee ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="inline-flex px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIssues.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                    Tidak ada isu yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleBoardDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {visibleStatuses.map((status) => {
              const columnIssues = filteredIssues.filter((issue) => issue.status === status);
              return (
                <div key={status} className="w-72 shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200">
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <h3 className="font-semibold text-slate-800 text-sm">{status}</h3>
                    <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {columnIssues.length}
                    </span>
                  </div>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 space-y-3 min-h-[140px]">
                        {columnIssues.map((issue, index) => {
                          const sla = getIssueSlaInfo(issue);
                          return (
                            <Draggable key={issue.id} draggableId={issue.id} index={index}>
                              {(draggableProvided) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className="bg-white p-3 rounded-lg border border-slate-200 cursor-grab active:cursor-grabbing"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs text-slate-400 font-semibold">{issue.id}</span>
                                    <SeverityBadge severity={issue.severity} />
                                  </div>
                                  <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                                  <div className="mt-2">
                                    <SlaBadge label={sla.label} tone={sla.tone} />
                                  </div>
                                  <button
                                    type="button"
                                    onMouseDown={(event) => event.stopPropagation()}
                                    onClick={() => setSelectedIssueId(issue.id)}
                                    className="mt-2 inline-flex px-2.5 py-1 text-[11px] rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                                  >
                                    Buka Detail
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          projectName={projectName}
          slaLabel={getIssueSlaInfo(selectedIssue).label}
          slaTone={getIssueSlaInfo(selectedIssue).tone}
          onClose={() => setSelectedIssueId(null)}
          onStatusChange={(status) => void handleStatusChange(selectedIssue.id, status)}
          onEscalate={() => void handleEscalate(selectedIssue.id)}
        />
      )}

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedAttachments([]);
            setIsCreateModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Lapor Bug Proyek</h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedAttachments([]);
                  setIsCreateModalOpen(false);
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreateIssue(event)} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Isu</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={createForm.severity}
                    onChange={(event) => setCreateForm((current) => ({ ...current, severity: event.target.value as IssueSeverity }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    {ISSUE_SEVERITY_ORDER.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pelapor</label>
                  <input
                    type="text"
                    value={createForm.reporter}
                    readOnly
                    className="w-full border border-slate-300 bg-slate-100 rounded-md px-3 py-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={createForm.assignee}
                    onChange={(event) => setCreateForm((current) => ({ ...current, assignee: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((assigneeName) => (
                      <option key={assigneeName} value={assigneeName}>
                        {assigneeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Modul</label>
                  <input
                    type="text"
                    value={createForm.module}
                    onChange={(event) => setCreateForm((current) => ({ ...current, module: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Environment</label>
                  <input
                    type="text"
                    value={createForm.environment}
                    onChange={(event) => setCreateForm((current) => ({ ...current, environment: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Langkah Reproduksi (1 baris per langkah)</label>
                <textarea
                  rows={4}
                  value={createForm.reproductionSteps}
                  onChange={(event) => setCreateForm((current) => ({ ...current, reproductionSteps: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Actual Result</label>
                  <textarea
                    rows={3}
                    value={createForm.actualResult}
                    onChange={(event) => setCreateForm((current) => ({ ...current, actualResult: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Result</label>
                  <textarea
                    rows={3}
                    value={createForm.expectedResult}
                    onChange={(event) => setCreateForm((current) => ({ ...current, expectedResult: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              {canUploadAttachment && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lampiran Bukti</label>
                <input
                  type="file"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length === 0) return;
                    setSelectedAttachments((current) => {
                      const existing = new Set(
                        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
                      );
                      const merged = files.filter(
                        (file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`)
                      );
                      return [...current, ...merged];
                    });
                    event.currentTarget.value = "";
                  }}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                />
                <div className="mt-2 space-y-2">
                  {selectedAttachments.length === 0 && (
                    <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-2">
                      Belum ada file dipilih.
                    </div>
                  )}
                  {selectedAttachments.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 bg-slate-50"
                    >
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAttachments((current) =>
                            current.filter((_, attachmentIndex) => attachmentIndex !== index)
                          )
                        }
                        className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAttachments([]);
                    setIsCreateModalOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  Simpan Isu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
