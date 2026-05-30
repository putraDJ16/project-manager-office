import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CalendarClock,
  Loader2,
  MessageSquare,
  Paperclip
} from "lucide-react";
import {
  ISSUE_STATUS_ORDER,
  type Issue,
  type IssueStatus,
  type SlaConfig
} from "../../domain/issues";
import { loadAuthSession } from "../../data/auth";
import { hasPermission } from "../../utils/permissions";
import { escalateIssue, getIssues, getSlaConfig, updateIssueStatus } from "../../services/issueService";
import { getSlaIndicator, type SlaIndicatorTone } from "../../services/issueSla";
import { fetchProjects, type ApiProject } from "../../services/projectApi";

export function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = loadAuthSession();
  const canEditIssue = hasPermission(session, "issues", "edit") || hasPermission(session, "projectIssues", "edit");
  const [issue, setIssue] = useState<Issue | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [slaConfig, setSlaConfig] = useState<SlaConfig | null>(null);
  const [slaTone, setSlaTone] = useState<SlaIndicatorTone>("safe");
  const [slaLabel, setSlaLabel] = useState("Memuat...");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!issueId) return;
      setIsLoading(true);
      setNotice(null);
      try {
        const [fetchedIssues, fetchedSla, fetchedProjects] = await Promise.all([
          getIssues(),
          getSlaConfig(),
          fetchProjects()
        ]);
        if (isCancelled) return;

        const selectedIssue = fetchedIssues.find((entry) => entry.id === issueId) ?? null;
        setIssue(selectedIssue);
        setProjects(fetchedProjects);
        setSlaConfig(fetchedSla);

        if (selectedIssue) {
          const indicator = getSlaIndicator(selectedIssue, fetchedSla);
          setSlaTone(indicator.tone);
          setSlaLabel(indicator.label);
        }
      } catch (error) {
        if (!isCancelled) {
          setNotice({
            type: "error",
            message: error instanceof Error ? error.message : "Gagal memuat detail isu."
          });
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      isCancelled = true;
    };
  }, [issueId]);

  const projectName = useMemo(() => {
    if (!issue) return "-";
    return projects.find((project) => project.id === issue.projectId)?.name ?? issue.projectId;
  }, [issue, projects]);

  const backPath = searchParams.get("from") || "/isu/list";
  const isEscalateDisabled = !issue || issue.status === "Escalated" || issue.status === "Resolved";

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    if (!canEditIssue) {
      setNotice({ type: "error", message: "Role Anda belum memiliki izin mengubah status isu." });
      return;
    }

    setIsUpdatingStatus(true);
    setNotice(null);
    try {
      const updated = await updateIssueStatus(issue.id, status);
      setIssue(updated);
      if (slaConfig) {
        const indicator = getSlaIndicator(updated, slaConfig);
        setSlaTone(indicator.tone);
        setSlaLabel(indicator.label);
      }
      setNotice({ type: "success", message: "Status isu berhasil diperbarui." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal memperbarui status isu."
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEscalate = async () => {
    if (!issue) return;
    if (!canEditIssue) {
      setNotice({ type: "error", message: "Role Anda belum memiliki izin eskalasi isu." });
      return;
    }

    setIsEscalating(true);
    setNotice(null);
    try {
      const updated = await escalateIssue(issue.id);
      setIssue(updated);
      if (slaConfig) {
        const indicator = getSlaIndicator(updated, slaConfig);
        setSlaTone(indicator.tone);
        setSlaLabel(indicator.label);
      }
      setNotice({ type: "success", message: `Isu ${issue.id} berhasil dieskalasi.` });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal melakukan eskalasi isu."
      });
    } finally {
      setIsEscalating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 p-6">
        <div className="h-full rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Memuat detail isu...
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="h-full bg-slate-50 p-6">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mb-4 inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Detail isu tidak ditemukan.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <div className={`border-b px-6 py-2 ${getSlaBannerClass(slaTone)}`}>
        <div className="flex items-center text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 mr-2" />
          SLA: {slaLabel}
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="mb-3 inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center border border-red-100">
                <Bug className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">{issue.id}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded border ${getSeverityBadgeClass(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 break-words">{issue.title}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={issue.status}
              disabled={isUpdatingStatus || !canEditIssue}
              onChange={(event) => void handleStatusChange(event.target.value as IssueStatus)}
              className="border border-slate-300 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {ISSUE_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isEscalateDisabled || isEscalating || !canEditIssue}
              onClick={() => void handleEscalate()}
              className="inline-flex items-center px-3 py-2 rounded-md border border-red-200 bg-white text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEscalating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Eskalasi
            </button>
          </div>
        </div>

        {notice && (
          <div className={`mt-4 rounded-md border px-3 py-2 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {notice.message}
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Deskripsi</h2>
              <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">{issue.description || "-"}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Langkah Reproduksi</h2>
              {issue.reproductionSteps.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada langkah reproduksi.</p>
              ) : (
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2">
                  {issue.reproductionSteps.map((step, index) => (
                    <li key={`${issue.id}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              )}
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h2 className="text-xs font-bold uppercase text-red-700 mb-2">Actual Result</h2>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{issue.actualResult || "-"}</p>
              </section>
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h2 className="text-xs font-bold uppercase text-emerald-700 mb-2">Expected Result</h2>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{issue.expectedResult || "-"}</p>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Aktivitas & Log
              </h2>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                  SYS
                </div>
                <div>
                  <p className="text-sm text-slate-800">
                    Status saat ini <span className="font-semibold">{issue.status}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update terakhir: {new Date(issue.updatedAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Informasi Isu</h2>
              <dl className="space-y-4 text-sm">
                <InfoRow label="Proyek" value={projectName} />
                <InfoRow label="Pelapor" value={issue.reporter} />
                <InfoRow label="Assignee" value={issue.assignee ?? "Unassigned"} strong />
                <InfoRow label="Modul" value={issue.module || "-"} />
                <InfoRow label="Environment" value={issue.environment || "-"} mono />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <CalendarClock className="w-4 h-4 mr-2" />
                Waktu
              </h2>
              <dl className="space-y-4 text-sm">
                <InfoRow label="Dibuat" value={new Date(issue.createdAt).toLocaleString("id-ID")} />
                <InfoRow label="Diperbarui" value={new Date(issue.updatedAt).toLocaleString("id-ID")} />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                <Paperclip className="w-4 h-4 mr-2" />
                Lampiran Bukti
              </h2>
              <div className="space-y-2">
                {issue.attachments.length === 0 && (
                  <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-2">
                    Belum ada lampiran.
                  </div>
                )}
                {issue.attachments.map((attachment) => (
                  <div key={attachment} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{attachment}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strong = false, mono = false }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-slate-800 ${strong ? "font-semibold text-red-700" : ""} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function getSeverityBadgeClass(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-red-900 text-red-50 border-red-950",
    Critical: "bg-red-600 text-white border-red-700",
    Major: "bg-orange-100 text-orange-800 border-orange-200",
    Minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Trivial: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return styles[severity];
}

function getSlaBannerClass(tone: SlaIndicatorTone) {
  if (tone === "breached") return "bg-red-50 border-red-200 text-red-700";
  if (tone === "warning") return "bg-amber-50 border-amber-200 text-amber-700";
  if (tone === "resolved") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  return "bg-sky-50 border-sky-200 text-sky-700";
}
