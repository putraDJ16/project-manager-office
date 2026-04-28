import { type FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { TaskFormFields, type TaskFormState, type TaskPriority } from "./TaskFormFields";

type TaskSummary = {
  id: string;
  title: string;
  phaseId: string;
  assignee: string;
  priority: TaskPriority;
  createdBy: string;
  createdAt: string;
  phaseUpdatedAt: string | null;
  startDate: string | null;
  endDate: string | null;
};

type TaskDetailPanelProps = {
  task: TaskSummary;
  projectName: string;
  phaseOptions: Array<{ id: string; name: string }>;
  assigneeOptions: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (value: TaskFormState) => void;
};

export function TaskDetailPanel({
  task,
  projectName,
  phaseOptions,
  assigneeOptions,
  onClose,
  onSave
}: TaskDetailPanelProps) {
  const [form, setForm] = useState<TaskFormState>({
    title: task.title,
    phaseId: task.phaseId,
    assignee: task.assignee,
    priority: task.priority,
    startDate: task.startDate ?? "",
    endDate: task.endDate ?? ""
  });

  useEffect(() => {
    setForm({
      title: task.title,
      phaseId: task.phaseId,
      assignee: task.assignee,
      priority: task.priority,
      startDate: task.startDate ?? "",
      endDate: task.endDate ?? ""
    });
  }, [task]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(form);
  };

  const formatDateTime = (value: string | null) => {
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detail Tugas {task.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Project: {projectName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Dibuat Oleh</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{task.createdBy}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Tanggal Buat</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{formatDateTime(task.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Edit Fase Terakhir</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{formatDateTime(task.phaseUpdatedAt)}</p>
            </div>
          </div>
          <TaskFormFields
            value={form}
            onChange={setForm}
            phaseOptions={phaseOptions}
            assigneeOptions={assigneeOptions}
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
