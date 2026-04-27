import { AlertTriangle, MessageSquare, Paperclip, X } from "lucide-react";
import {
  ISSUE_STATUS_ORDER,
  type Issue,
  type IssueStatus
} from "../../domain/issues";
import { type SlaIndicatorTone } from "../../services/issueSla";

type IssueDetailPanelProps = {
  issue: Issue;
  projectName: string;
  slaLabel: string;
  slaTone: SlaIndicatorTone;
  onClose: () => void;
  onStatusChange: (status: IssueStatus) => void;
  onEscalate: () => void;
};

export function IssueDetailPanel({
  issue,
  projectName,
  slaLabel,
  slaTone,
  onClose,
  onStatusChange,
  onEscalate
}: IssueDetailPanelProps) {
  const isEscalateDisabled = issue.status === "Escalated" || issue.status === "Resolved";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[92vh] bg-white shadow-2xl border border-slate-200 rounded-xl flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className={`px-6 py-2 flex items-center border-b ${getSlaBannerClass(slaTone)}`}>
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold">SLA: {slaLabel}</span>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="flex-1">
            <select
              value={issue.status}
              onChange={(event) => onStatusChange(event.target.value as IssueStatus)}
              className="border border-slate-300 rounded text-sm font-medium py-1 px-2 focus:outline-none focus:border-red-500 bg-slate-50 text-slate-700"
            >
              {ISSUE_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={isEscalateDisabled}
            onClick={onEscalate}
            className="px-3 py-1.5 border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eskalasi Manual
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-slate-500">{issue.id}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded shadow-sm border ${getSeverityBadgeClass(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{issue.title}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Pelapor</span>
                <span className="text-sm text-slate-900">{issue.reporter}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Proyek</span>
                <span className="text-sm text-slate-900">{projectName}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Assignee</span>
                <span className="text-sm font-medium text-indigo-600">{issue.assignee ?? "Unassigned"}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Modul</span>
                <span className="text-sm text-slate-900">{issue.module}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500 mb-1">Environment</span>
                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-mono">{issue.environment}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Deskripsi</h3>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">{issue.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Langkah Reproduksi</h3>
                <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
                  {issue.reproductionSteps.map((step, index) => (
                    <li key={`${issue.id}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded border border-red-100">
                  <span className="block text-xs font-semibold text-red-800 mb-1">Actual Result</span>
                  <span className="text-sm text-slate-700">{issue.actualResult}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
                  <span className="block text-xs font-semibold text-emerald-800 mb-1">Expected Result</span>
                  <span className="text-sm text-slate-700">{issue.expectedResult}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" /> Lampiran Bukti
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {issue.attachments.length === 0 && (
                    <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md px-3 py-2">
                      Belum ada lampiran
                    </div>
                  )}
                  {issue.attachments.map((attachment) => (
                    <div key={attachment} className="w-32 h-20 bg-slate-200 rounded border border-slate-300 flex flex-col justify-end p-2">
                      <span className="text-[10px] bg-black/50 text-white rounded px-1 w-max">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" /> Aktivitas & Log
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600">SYS</div>
                <div>
                  <p className="text-sm text-slate-800">
                    Status saat ini <span className="font-semibold">{issue.status}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Update terakhir: {new Date(issue.updatedAt).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Tambahkan komentar atau update log..."
                className="w-full text-sm rounded-lg border-slate-300 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-3 resize-none shadow-sm"
              ></textarea>
              <button className="absolute bottom-3 right-3 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded shadow hover:bg-indigo-700">Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSeverityBadgeClass(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-red-900 text-red-50 border-red-950",
    Critical: "bg-red-600 text-white border-red-700",
    Major: "bg-orange-500 text-white border-orange-600",
    Minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Trivial: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return styles[severity];
}

function getSlaBannerClass(tone: SlaIndicatorTone) {
  if (tone === "breached") return "bg-red-100 border-red-200 text-red-800";
  if (tone === "warning") return "bg-amber-100 border-amber-200 text-amber-800";
  if (tone === "resolved") return "bg-emerald-100 border-emerald-200 text-emerald-800";
  return "bg-blue-50 border-blue-100 text-blue-700";
}

