import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, ExternalLink, Loader2, Trash2, X } from "lucide-react";
import type { Employee } from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import type { Meeting, MeetingNote, RsvpStatus } from "../../domain/meetings";
import { deleteMeeting, fetchMeeting, rsvpMeeting } from "../../services/meetingApi";
import { fetchMeetingNote } from "../../services/meetingNoteApi";
import { MeetingFilesPanel } from "./MeetingFilesPanel";
import { MeetingNoteEditor } from "./MeetingNoteEditor";

type Props = {
  projectId: string;
  meeting: Meeting;
  employees: Employee[];
  canEdit: boolean;
  canDelete: boolean;
  showMeetingEdit?: boolean;
  initialTab?: "info" | "notes";
  onClose: () => void;
  onEdit: (meeting: Meeting) => void;
  onChanged: (meeting?: Meeting) => void;
  onNotice: (notice: { type: "success" | "error"; msg: string }) => void;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function MeetingDetailModal({
  projectId,
  meeting,
  employees,
  canEdit,
  canDelete,
  showMeetingEdit = true,
  initialTab = "info",
  onClose,
  onEdit,
  onChanged,
  onNotice
}: Props) {
  const [currentMeeting, setCurrentMeeting] = useState(meeting);
  const [note, setNote] = useState<MeetingNote | null>(meeting.note);
  const [tab, setTab] = useState(initialTab);
  const [busy, setBusy] = useState(false);
  const session = loadAuthSession();

  useEffect(() => {
    setCurrentMeeting(meeting);
    setNote(meeting.note);
    setTab(initialTab);
  }, [meeting, initialTab]);

  useEffect(() => {
    fetchMeetingNote(projectId, meeting.id)
      .then(setNote)
      .catch(() => setNote(null));
  }, [projectId, meeting.id]);

  const myAttendee = useMemo(
    () => currentMeeting.attendees.find((attendee) => attendee.employee_id === session?.employeeId) ?? null,
    [currentMeeting.attendees, session?.employeeId]
  );

  const refreshMeeting = async () => {
    const refreshed = await fetchMeeting(projectId, currentMeeting.id);
    setCurrentMeeting(refreshed);
    setNote(refreshed.note);
    onChanged(refreshed);
  };

  const handleRsvp = async (status: RsvpStatus) => {
    setBusy(true);
    try {
      const result = await rsvpMeeting(projectId, currentMeeting.id, status);
      onNotice({ type: "success", msg: result.message ?? "RSVP berhasil diperbarui." });
      await refreshMeeting();
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal memperbarui RSVP." });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const result = await deleteMeeting(projectId, currentMeeting.id);
      onNotice({ type: "success", msg: result.message ?? "Meeting berhasil dihapus." });
      onChanged(undefined);
      onClose();
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal menghapus meeting." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={busy ? undefined : onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-color-border bg-color-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-color-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-color-foreground">{currentMeeting.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-color-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {formatDateTime(currentMeeting.start_datetime)} - {formatDateTime(currentMeeting.end_datetime)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && showMeetingEdit && (
              <button
                type="button"
                onClick={() => onEdit(currentMeeting)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border hover:bg-color-secondary"
                title="Edit meeting"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border text-color-destructive hover:bg-color-destructive/10 disabled:opacity-60"
                title="Hapus meeting"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border hover:bg-color-secondary disabled:opacity-60"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-color-border px-5">
          {[
            { key: "info", label: "Info & RSVP" },
            { key: "notes", label: "Catatan & Dokumen" }
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as "info" | "notes")}
              className={`mr-4 border-b-2 px-1 py-3 text-sm font-medium ${
                tab === item.key ? "border-color-primary text-color-primary" : "border-transparent text-color-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 p-5">
          {tab === "info" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Info label="Status" value={currentMeeting.effective_status ?? currentMeeting.status} />
                <Info label="Tipe" value={currentMeeting.meeting_type} />
                <Info label={currentMeeting.meeting_type === "Online" ? "URL" : "Lokasi"} value={currentMeeting.meeting_type === "Online" ? currentMeeting.meeting_url : currentMeeting.location} />
              </div>
              {currentMeeting.description && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-color-foreground">Agenda</h3>
                  <p className="whitespace-pre-wrap text-sm text-color-muted-foreground">{currentMeeting.description}</p>
                </div>
              )}
              {currentMeeting.meeting_url && (
                <a
                  href={currentMeeting.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-color-border px-3 py-2 text-sm font-medium text-color-primary hover:bg-color-secondary"
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Buka Link Meeting
                </a>
              )}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-color-foreground">Peserta</h3>
                <div className="divide-y divide-color-border rounded-lg border border-color-border">
                  {currentMeeting.attendees.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-color-muted-foreground">Belum ada peserta.</div>
                  ) : (
                    currentMeeting.attendees.map((attendee) => (
                      <div key={attendee.employee_id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm text-color-foreground">{attendee.employee_name ?? attendee.employee_id}</span>
                        <span className="rounded-md bg-color-accent px-2 py-0.5 text-xs font-semibold text-color-muted-foreground">
                          {attendee.rsvp_status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {myAttendee && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-color-muted-foreground">RSVP saya:</span>
                  {(["Accepted", "Declined"] as RsvpStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void handleRsvp(status)}
                      disabled={busy || myAttendee.rsvp_status === status}
                      className="rounded-md border border-color-border px-3 py-1.5 text-sm hover:bg-color-secondary disabled:bg-color-accent disabled:opacity-70"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <MeetingNoteEditor
                projectId={projectId}
                meetingId={currentMeeting.id}
                note={note}
                employees={employees}
                canEdit={canEdit}
                onSaved={(savedNote, message) => {
                  setNote(savedNote);
                  onNotice({ type: "success", msg: message ?? "Catatan meeting berhasil disimpan." });
                  void refreshMeeting();
                }}
                onError={(message) => onNotice({ type: "error", msg: message })}
              />
              <MeetingFilesPanel
                projectId={projectId}
                meetingId={currentMeeting.id}
                canEdit={canEdit}
                onNotice={onNotice}
                onFilesChanged={() => void refreshMeeting()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-color-border px-3 py-2">
      <p className="text-xs text-color-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-color-foreground">{value || "-"}</p>
    </div>
  );
}
