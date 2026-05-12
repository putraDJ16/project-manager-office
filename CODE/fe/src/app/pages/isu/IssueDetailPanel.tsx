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
    <div className="fixed inset-0 z-50 bg-color-foreground/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[92vh] bg-color-card shadow-2xl border border-color-border rounded-xl flex flex-col overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className={`px-6 py-2 flex items-center border-b ${getSlaBannerClass(slaTone)}`}>
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold">SLA: {slaLabel}</span>
        </div>

        <div className="px-6 py-4 border-b border-color-border flex items-center gap-3 bg-color-card">
          <div className="flex-1">
            <select
              value={issue.status}
              onChange={(event) => onStatusChange(event.target.value as IssueStatus)}
              className="border border-color-border rounded text-sm font-medium py-1 px-2 focus:outline-none focus:border-color-destructive bg-color-secondary text-color-foreground"
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
            className="px-3 py-1.5 border border-color-destructive/40 text-color-destructive text-sm font-medium rounded-md hover:bg-color-destructive/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eskalasi Manual
          </button>
          <button onClick={onClose} className="p-1.5 text-color-muted-foreground hover:text-color-muted-foreground rounded-md hover:bg-color-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-color-muted-foreground">{issue.id}</span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded shadow-sm border ${getSeverityBadgeClass(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-color-foreground mb-6">{issue.title}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-color-secondary rounded-lg border border-color-border">
              <div>
                <span className="block text-xs font-medium text-color-muted-foreground mb-1">Pelapor</span>
                <span className="text-sm text-color-foreground">{issue.reporter}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-color-muted-foreground mb-1">Proyek</span>
                <span className="text-sm text-color-foreground">{projectName}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-color-muted-foreground mb-1">Assignee</span>
                <span className="text-sm font-medium text-color-primary">{issue.assignee ?? "Unassigned"}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-color-muted-foreground mb-1">Modul</span>
                <span className="text-sm text-color-foreground">{issue.module}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-color-muted-foreground mb-1">Environment</span>
                <span className="text-xs px-2 py-0.5 bg-color-secondary text-color-foreground rounded-full font-mono">{issue.environment}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-color-foreground mb-2">Deskripsi</h3>
                <p className="text-sm text-color-foreground bg-color-secondary p-3 rounded border border-color-border">{issue.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-color-foreground mb-2">Langkah Reproduksi</h3>
                <ol className="list-decimal list-inside text-sm text-color-foreground space-y-1">
                  {issue.reproductionSteps.map((step, index) => (
                    <li key={`${issue.id}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-color-destructive/15 rounded border border-color-destructive/40">
                  <span className="block text-xs font-semibold text-color-destructive mb-1">Actual Result</span>
                  <span className="text-sm text-color-foreground">{issue.actualResult}</span>
                </div>
                <div className="p-3 bg-color-status-success-surface rounded border border-color-status-success-border">
                  <span className="block text-xs font-semibold text-color-status-success mb-1">Expected Result</span>
                  <span className="text-sm text-color-foreground">{issue.expectedResult}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-color-foreground mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" /> Lampiran Bukti
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {issue.attachments.length === 0 && (
                    <div className="text-xs text-color-muted-foreground border border-dashed border-color-border rounded-md px-3 py-2">
                      Belum ada lampiran
                    </div>
                  )}
                  {issue.attachments.map((attachment) => (
                    <div key={attachment} className="w-32 h-20 bg-color-secondary rounded border border-color-border flex flex-col justify-end p-2">
                      <span className="text-xs bg-color-card text-color-card-foreground rounded px-2 w-max">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-color-border bg-color-secondary px-6 py-6">
            <h3 className="text-sm font-semibold text-color-foreground mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" /> Aktivitas & Log
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-color-secondary flex-shrink-0 flex items-center justify-center text-xs font-bold text-color-muted-foreground">SYS</div>
                <div>
                  <p className="text-sm text-color-foreground">
                    Status saat ini <span className="font-semibold">{issue.status}</span>
                  </p>
                  <p className="text-xs text-color-muted-foreground mt-0.5">Update terakhir: {new Date(issue.updatedAt).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Tambahkan komentar atau update log..."
                className="w-full text-sm rounded-lg border-color-border border focus:border-color-ring focus:ring-1 focus:ring-color-ring p-3 resize-none shadow-sm"
              ></textarea>
              <button className="absolute bottom-3 right-3 px-3 py-1 bg-color-primary text-color-primary-foreground text-xs font-medium rounded shadow hover:bg-color-primary">Kirim</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSeverityBadgeClass(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-color-destructive text-color-destructive-foreground border-color-destructive",
    Critical: "bg-color-destructive text-color-destructive-foreground border-color-destructive",
    Major: "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border",
    Minor: "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border",
    Trivial: "bg-color-accent text-color-muted-foreground border-color-border"
  };

  return styles[severity];
}

function getSlaBannerClass(tone: SlaIndicatorTone) {
  if (tone === "breached") return "bg-color-destructive/15 border-color-destructive/40 text-color-destructive";
  if (tone === "warning") return "bg-color-status-warning-surface border-color-status-warning-border text-color-status-warning";
  if (tone === "resolved") return "bg-color-status-success-surface border-color-status-success-border text-color-status-success";
  return "bg-color-status-info-surface border-color-status-info-border text-color-status-info";
}

