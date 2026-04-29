import { type FormEvent, useMemo, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

type TaskComment = {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
};

type TaskDetail = {
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

type TaskDetailModalProps = {
  task: TaskDetail;
  projectName: string;
  phaseName: string;
  assigneeName: string;
  comments: TaskComment[];
  isLoadingComments: boolean;
  isSavingComment: boolean;
  canCreateComment?: boolean;
  onClose: () => void;
  onSubmitComment: (content: string) => Promise<void>;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function TaskDetailModal({
  task,
  projectName,
  phaseName,
  assigneeName,
  comments,
  isLoadingComments,
  isSavingComment,
  canCreateComment = true,
  onClose,
  onSubmitComment
}: TaskDetailModalProps) {
  const [draftComment, setDraftComment] = useState("");

  const priorityClass = useMemo(() => {
    const map: Record<TaskDetail["priority"], string> = {
      Low: "bg-emerald-100 text-emerald-700",
      Medium: "bg-amber-100 text-amber-700",
      High: "bg-orange-100 text-orange-700",
      Critical: "bg-rose-100 text-rose-700"
    };
    return map[task.priority];
  }, [task.priority]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draftComment.trim();
    if (!value) return;
    try {
      await onSubmitComment(value);
      setDraftComment("");
    } catch {
      // Error toast/notice is handled by parent component.
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-semibold">{task.id}</p>
            <h2 className="text-xl font-bold text-slate-900 truncate">{task.title}</h2>
            <p className="text-xs text-slate-500 mt-1">Project: {projectName}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 border-b border-slate-200 bg-slate-50">
          <InfoItem label="Fase" value={phaseName} />
          <InfoItem label="Assignee" value={assigneeName} />
          <InfoItem label="Dibuat Oleh" value={task.createdBy} />
          <InfoItem label="Mulai" value={formatDate(task.startDate)} />
          <InfoItem label="Selesai" value={formatDate(task.endDate)} />
          <InfoItem label="Terakhir Diubah" value={formatDateTime(task.updatedAt)} />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Prioritas</p>
            <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-semibold rounded-md ${priorityClass}`}>
              {task.priority}
            </span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Progress</p>
            <p className="text-sm text-slate-800 font-semibold mt-1">{task.progressPercentage}%</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" /> Komentar
          </h3>

          {isLoadingComments ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Memuat komentar...
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Belum ada komentar pada tugas ini.
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{comment.authorName}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {canCreateComment ? (
            <form onSubmit={(event) => void handleSubmit(event)} className="mt-4">
              <textarea
                value={draftComment}
                onChange={(event) => setDraftComment(event.target.value)}
                rows={3}
                placeholder="Tulis komentar seperti di Trello..."
                className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
                maxLength={2000}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-500">{draftComment.length}/2000 karakter</p>
                <button
                  type="submit"
                  disabled={isSavingComment || draftComment.trim().length === 0}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {isSavingComment ? "Mengirim..." : "Kirim Komentar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Role Anda hanya dapat melihat komentar, belum dapat menambahkan komentar baru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 font-medium mt-1">{value || "-"}</p>
    </div>
  );
}
