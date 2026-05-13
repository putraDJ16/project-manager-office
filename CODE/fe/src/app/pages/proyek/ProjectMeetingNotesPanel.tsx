import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, FileText, Search, X } from "lucide-react";
import type { Employee } from "../../data/masterData";
import type { Meeting, MeetingNoteSummary } from "../../domain/meetings";
import { fetchMeeting } from "../../services/meetingApi";
import { fetchProjectMeetingNotes } from "../../services/meetingNoteApi";
import { MeetingDetailModal } from "./MeetingDetailModal";

type Props = {
  projectId: string;
  employees: Employee[];
  canEdit: boolean;
  canDelete: boolean;
  onNotice: (notice: { type: "success" | "error"; msg: string }) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function ProjectMeetingNotesPanel({ projectId, employees, canEdit, canDelete, onNotice }: Props) {
  const [notes, setNotes] = useState<MeetingNoteSummary[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState({ search: "", start_date: "", end_date: "", has_open_action: false });
  const [filters, setFilters] = useState(filterInput);

  const loadNotes = async () => {
    setLoading(true);
    try {
      setNotes(await fetchProjectMeetingNotes(projectId, filters));
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal memuat catatan meeting." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, [projectId, filters.search, filters.start_date, filters.end_date, filters.has_open_action]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(filterInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2 rounded-xl border border-color-border bg-color-secondary p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-color-muted-foreground" />
          <input
            value={filterInput.search}
            onChange={(event) => setFilterInput((current) => ({ ...current, search: event.target.value }))}
            placeholder="Cari catatan meeting..."
            className="h-9 w-72 rounded-md border border-color-border pl-9 pr-8 text-sm"
          />
          {filterInput.search && (
            <button
              type="button"
              onClick={() => {
                setFilterInput((current) => ({ ...current, search: "" }));
                setFilters((current) => ({ ...current, search: "" }));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-color-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          type="date"
          value={filterInput.start_date}
          onChange={(event) => setFilterInput((current) => ({ ...current, start_date: event.target.value }))}
          className="h-9 rounded-md border border-color-border px-3 text-sm"
        />
        <input
          type="date"
          value={filterInput.end_date}
          onChange={(event) => setFilterInput((current) => ({ ...current, end_date: event.target.value }))}
          className="h-9 rounded-md border border-color-border px-3 text-sm"
        />
        <label className="inline-flex h-9 items-center gap-2 rounded-md border border-color-border bg-color-card px-3 text-sm">
          <input
            type="checkbox"
            checked={filterInput.has_open_action}
            onChange={(event) => setFilterInput((current) => ({ ...current, has_open_action: event.target.checked }))}
          />
          Open action
        </label>
        <button type="submit" className="h-9 rounded-md bg-color-primary px-3 text-sm text-color-primary-foreground">
          Cari
        </button>
        {(filterInput.search || filterInput.start_date || filterInput.end_date || filterInput.has_open_action) && (
          <button
            type="button"
            onClick={() => {
              const reset = { search: "", start_date: "", end_date: "", has_open_action: false };
              setFilterInput(reset);
              setFilters(reset);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border bg-color-card"
            title="Clear filter"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <div className="rounded-xl border border-dashed border-color-border px-4 py-8 text-center text-sm text-color-muted-foreground">
          Memuat catatan meeting...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-color-border px-4 py-10 text-center text-sm text-color-muted-foreground">
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Belum ada catatan meeting yang cocok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {notes.map((note) => (
            <button
              key={note.meeting_id}
              type="button"
              onClick={async () => {
                try {
                  setSelectedMeeting(await fetchMeeting(projectId, note.meeting_id));
                } catch (error) {
                  onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal membuka meeting." });
                }
              }}
              className="rounded-xl border border-color-border bg-color-card p-4 text-left hover:border-color-primary/50 hover:bg-color-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-color-foreground">{note.title}</h3>
                  <p className="mt-1 text-xs text-color-muted-foreground">{formatDate(note.start_datetime)}</p>
                </div>
                {note.action_items_open > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-color-status-warning-surface px-2 py-0.5 text-xs font-semibold text-color-status-warning">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {note.action_items_open}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-color-muted-foreground">{note.summary || "Tanpa ringkasan."}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-color-muted-foreground">
                <span>{note.action_items_open}/{note.action_items_total} action open</span>
                <span>{note.files_count} dokumen</span>
                <span>{note.decisions_count} keputusan</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedMeeting && (
        <MeetingDetailModal
          projectId={projectId}
          meeting={selectedMeeting}
          employees={employees}
          canEdit={canEdit}
          canDelete={canDelete}
          showMeetingEdit={false}
          initialTab="notes"
          onClose={() => setSelectedMeeting(null)}
          onEdit={() => undefined}
          onChanged={(meeting) => {
            if (meeting) setSelectedMeeting(meeting);
            void loadNotes();
          }}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
