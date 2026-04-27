import type { Dispatch, SetStateAction } from "react";

export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskFormState = {
  title: string;
  phaseId: string;
  assignee: string;
  priority: TaskPriority;
};

export const taskPriorityOptions: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

type TaskFormFieldsProps = {
  value: TaskFormState;
  onChange: Dispatch<SetStateAction<TaskFormState>>;
  phaseOptions: Array<{ id: string; name: string }>;
  assigneeOptions: Array<{ id: string; name: string }>;
};

export function TaskFormFields({ value, onChange, phaseOptions, assigneeOptions }: TaskFormFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Tugas</label>
        <input
          type="text"
          value={value.title}
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          placeholder="Contoh: Integrasi OAuth ke modul login"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Fase</label>
          <select
            value={value.phaseId}
            onChange={(event) => onChange((current) => ({ ...current, phaseId: event.target.value }))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {phaseOptions.map((phase) => (
              <option key={phase.id} value={phase.id}>{phase.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Assignee</label>
          <select
            value={value.assignee}
            onChange={(event) => onChange((current) => ({ ...current, assignee: event.target.value }))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {assigneeOptions.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Prioritas</label>
          <select
            value={value.priority}
            onChange={(event) => onChange((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {taskPriorityOptions.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
