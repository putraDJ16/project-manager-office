import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save, X } from "lucide-react";
import type { ApiProjectMember } from "../../services/projectApi";
import type { Meeting } from "../../domain/meetings";
import { createMeeting, updateMeeting, type MeetingPayload } from "../../services/meetingApi";

type Props = {
  projectId: string;
  members: ApiProjectMember[];
  meeting?: Meeting | null;
  onClose: () => void;
  onSaved: (meeting: Meeting, message?: string) => void;
  onError: (message: string) => void;
};

function toLocalInputValue(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromLocalInputValue(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function MeetingFormModal({ projectId, members, meeting, onClose, onSaved, onError }: Props) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    meeting_type: "Online" as "Online" | "Offline",
    meeting_url: "",
    start_datetime: "",
    end_datetime: "",
    attendee_ids: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!meeting) return;
    setForm({
      title: meeting.title,
      description: meeting.description ?? "",
      location: meeting.location ?? "",
      meeting_type: meeting.meeting_type,
      meeting_url: meeting.meeting_url ?? "",
      start_datetime: toLocalInputValue(meeting.start_datetime),
      end_datetime: toLocalInputValue(meeting.end_datetime),
      attendee_ids: meeting.attendees.map((attendee) => attendee.employee_id)
    });
  }, [meeting]);

  const toggleAttendee = (employeeId: string) => {
    setForm((current) => ({
      ...current,
      attendee_ids: current.attendee_ids.includes(employeeId)
        ? current.attendee_ids.filter((item) => item !== employeeId)
        : [...current.attendee_ids, employeeId]
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: MeetingPayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        meeting_type: form.meeting_type,
        meeting_url: form.meeting_type === "Online" ? form.meeting_url.trim() || null : null,
        start_datetime: fromLocalInputValue(form.start_datetime),
        end_datetime: fromLocalInputValue(form.end_datetime),
        attendee_ids: form.attendee_ids
      };
      const result = meeting
        ? await updateMeeting(projectId, meeting.id, payload)
        : await createMeeting(projectId, payload);
      onSaved(result.data, result.message);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Gagal menyimpan meeting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={saving ? undefined : onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-color-border bg-color-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-color-border px-5 py-4">
          <h2 className="text-base font-semibold text-color-foreground">{meeting ? "Edit Meeting" : "Buat Meeting"}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-1 text-color-muted-foreground hover:bg-color-secondary disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-color-foreground">Judul</label>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
              disabled={saving}
              className="w-full rounded-md border border-color-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-color-foreground">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              disabled={saving}
              className="w-full rounded-md border border-color-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-color-foreground">Mulai</label>
              <input
                type="datetime-local"
                value={form.start_datetime}
                onChange={(event) => setForm((current) => ({ ...current, start_datetime: event.target.value }))}
                required
                disabled={saving}
                className="w-full rounded-md border border-color-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-color-foreground">Selesai</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(event) => setForm((current) => ({ ...current, end_datetime: event.target.value }))}
                required
                disabled={saving}
                className="w-full rounded-md border border-color-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-color-foreground">Tipe</label>
              <select
                value={form.meeting_type}
                onChange={(event) => setForm((current) => ({ ...current, meeting_type: event.target.value as "Online" | "Offline" }))}
                disabled={saving}
                className="w-full rounded-md border border-color-border px-3 py-2 text-sm"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-color-foreground">
                {form.meeting_type === "Online" ? "URL Meeting" : "Lokasi"}
              </label>
              <input
                value={form.meeting_type === "Online" ? form.meeting_url : form.location}
                onChange={(event) =>
                  setForm((current) =>
                    form.meeting_type === "Online"
                      ? { ...current, meeting_url: event.target.value }
                      : { ...current, location: event.target.value }
                  )
                }
                disabled={saving}
                className="w-full rounded-md border border-color-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-color-foreground">Peserta</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {members.map((member) => (
                <label key={member.employee_id} className="flex items-center gap-2 rounded-md border border-color-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.attendee_ids.includes(member.employee_id)}
                    onChange={() => toggleAttendee(member.employee_id)}
                    disabled={saving}
                  />
                  <span>{member.employee_name ?? member.employee_id}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-color-border px-4 py-2 text-sm disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="inline-flex items-center rounded-md bg-color-primary px-4 py-2 text-sm font-medium text-color-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
