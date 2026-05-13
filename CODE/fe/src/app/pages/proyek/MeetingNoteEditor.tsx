import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { Employee } from "../../data/masterData";
import type { MeetingNote } from "../../domain/meetings";
import { upsertMeetingNote } from "../../services/meetingNoteApi";

type DraftActionItem = {
  description: string;
  assignee_employee_id: string;
  due_date: string;
  is_done: boolean;
};

type Props = {
  projectId: string;
  meetingId: number;
  note: MeetingNote | null;
  employees: Employee[];
  canEdit: boolean;
  onSaved: (note: MeetingNote, message?: string) => void;
  onError: (message: string) => void;
};

const emptyActionItem: DraftActionItem = {
  description: "",
  assignee_employee_id: "",
  due_date: "",
  is_done: false
};

export function MeetingNoteEditor({ projectId, meetingId, note, employees, canEdit, onSaved, onError }: Props) {
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actionItems, setActionItems] = useState<DraftActionItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSummary(note?.summary ?? "");
    setNotes(note?.notes ?? "");
    setDecisions((note?.decisions ?? []).join("\n"));
    setActionItems(
      note?.action_items?.map((item) => ({
        description: item.description,
        assignee_employee_id: item.assignee_employee_id ?? "",
        due_date: item.due_date ?? "",
        is_done: item.is_done
      })) ?? []
    );
  }, [note]);

  const saveNote = async () => {
    setSaving(true);
    try {
      const result = await upsertMeetingNote(projectId, meetingId, {
        summary: summary.trim() || null,
        notes: notes.trim() || null,
        decisions: decisions
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        action_items: actionItems
          .filter((item) => item.description.trim())
          .map((item) => ({
            description: item.description.trim(),
            assignee_employee_id: item.assignee_employee_id || null,
            due_date: item.due_date || null,
            is_done: item.is_done
          }))
      });
      onSaved(result.data, result.message);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Gagal menyimpan catatan meeting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-color-muted-foreground">Ringkasan</label>
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={2}
          disabled={!canEdit || saving}
          className="w-full rounded-md border border-color-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring disabled:bg-color-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-color-muted-foreground">Notulen</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          disabled={!canEdit || saving}
          className="w-full rounded-md border border-color-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring disabled:bg-color-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-color-muted-foreground">Keputusan (1 baris per keputusan)</label>
        <textarea
          value={decisions}
          onChange={(event) => setDecisions(event.target.value)}
          rows={3}
          disabled={!canEdit || saving}
          className="w-full rounded-md border border-color-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring disabled:bg-color-accent"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-color-foreground">Action Items</h4>
          {canEdit && (
            <button
              type="button"
              onClick={() => setActionItems((current) => [...current, { ...emptyActionItem }])}
              className="inline-flex items-center rounded-md border border-color-border px-2.5 py-1.5 text-xs hover:bg-color-secondary"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
            </button>
          )}
        </div>

        {actionItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-color-border px-3 py-3 text-sm text-color-muted-foreground">
            Belum ada action item.
          </div>
        ) : (
          actionItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 rounded-lg border border-color-border p-3">
              <label className="col-span-12 flex items-center gap-2 text-xs text-color-muted-foreground md:col-span-1">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  disabled={!canEdit || saving}
                  onChange={(event) =>
                    setActionItems((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, is_done: event.target.checked } : entry
                      )
                    )
                  }
                />
                Done
              </label>
              <input
                value={item.description}
                disabled={!canEdit || saving}
                onChange={(event) =>
                  setActionItems((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, description: event.target.value } : entry
                    )
                  )
                }
                placeholder="Deskripsi action item"
                className="col-span-12 rounded-md border border-color-border px-3 py-2 text-sm md:col-span-5"
              />
              <select
                value={item.assignee_employee_id}
                disabled={!canEdit || saving}
                onChange={(event) =>
                  setActionItems((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, assignee_employee_id: event.target.value } : entry
                    )
                  )
                }
                className="col-span-12 rounded-md border border-color-border px-3 py-2 text-sm md:col-span-3"
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={item.due_date}
                disabled={!canEdit || saving}
                onChange={(event) =>
                  setActionItems((current) =>
                    current.map((entry, itemIndex) =>
                      itemIndex === index ? { ...entry, due_date: event.target.value } : entry
                    )
                  )
                }
                className="col-span-10 rounded-md border border-color-border px-3 py-2 text-sm md:col-span-2"
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setActionItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="col-span-2 inline-flex items-center justify-center rounded-md border border-color-border text-color-destructive hover:bg-color-destructive/10 md:col-span-1"
                  title="Hapus action item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void saveNote()}
            disabled={saving}
            className="inline-flex items-center rounded-md bg-color-primary px-4 py-2 text-sm font-medium text-color-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Simpan Catatan
          </button>
        </div>
      )}
    </div>
  );
}
