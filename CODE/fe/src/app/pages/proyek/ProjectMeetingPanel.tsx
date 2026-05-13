import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarClock, Loader2, Plus, Search, X } from "lucide-react";
import type { Employee } from "../../data/masterData";
import type { Meeting, MeetingStatus } from "../../domain/meetings";
import { fetchMeetings } from "../../services/meetingApi";
import type { ApiProjectMember } from "../../services/projectApi";
import { MeetingDetailModal } from "./MeetingDetailModal";
import { MeetingFormModal } from "./MeetingFormModal";

type Props = {
  projectId: string;
  members: ApiProjectMember[];
  employees: Employee[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onNotice: (notice: { type: "success" | "error"; msg: string }) => void;
};

const statuses: Array<MeetingStatus | "all"> = ["all", "Scheduled", "In Progress", "Done", "Cancelled"];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ProjectMeetingPanel({ projectId, members, employees, canCreate, canEdit, canDelete, onNotice }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState({ status: "all", start_date: "", end_date: "" });
  const [filters, setFilters] = useState(filterInput);
  const [formMeeting, setFormMeeting] = useState<Meeting | null | undefined>(undefined);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      setMeetings(await fetchMeetings(projectId, filters));
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal memuat meeting project." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, [projectId, filters.status, filters.start_date, filters.end_date]);

  const grouped = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: meetings.filter((meeting) => meeting.status !== "Cancelled" && new Date(meeting.end_datetime).getTime() >= now),
      past: meetings.filter((meeting) => meeting.status === "Cancelled" || new Date(meeting.end_datetime).getTime() < now)
    };
  }, [meetings]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters(filterInput);
  };

  const renderGroup = (title: string, items: Meeting[]) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-color-foreground">{title}</h3>
        <span className="rounded-md bg-color-accent px-2 py-0.5 text-xs font-semibold text-color-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-color-border">
        <table className="w-full text-sm">
          <thead className="border-b border-color-border bg-color-secondary text-xs uppercase text-color-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Judul</th>
              <th className="px-4 py-3 text-left font-medium">Tanggal & Waktu</th>
              <th className="px-4 py-3 text-left font-medium">Tipe</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Peserta</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-color-muted-foreground">
                  Tidak ada meeting.
                </td>
              </tr>
            ) : (
              items.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-color-secondary">
                  <td className="px-4 py-3 font-medium text-color-foreground">{meeting.title}</td>
                  <td className="px-4 py-3 text-color-muted-foreground">
                    {formatDateTime(meeting.start_datetime)} - {formatDateTime(meeting.end_datetime)}
                  </td>
                  <td className="px-4 py-3 text-color-muted-foreground">{meeting.meeting_type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-color-accent px-2 py-0.5 text-xs font-semibold text-color-muted-foreground">
                      {meeting.effective_status ?? meeting.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-color-muted-foreground">{meeting.attendee_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedMeeting(meeting)}
                      className="rounded-md border border-color-border px-3 py-1.5 text-xs font-medium hover:bg-color-accent"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2">
          <select
            value={filterInput.status}
            onChange={(event) => setFilterInput((current) => ({ ...current, status: event.target.value }))}
            className="h-9 rounded-md border border-color-border px-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                Status: {status === "all" ? "Semua" : status}
              </option>
            ))}
          </select>
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
          <button type="submit" className="inline-flex h-9 items-center rounded-md bg-color-primary px-3 text-sm text-color-primary-foreground">
            <Search className="mr-1.5 h-4 w-4" /> Cari
          </button>
          {(filterInput.status !== "all" || filterInput.start_date || filterInput.end_date) && (
            <button
              type="button"
              onClick={() => {
                const reset = { status: "all", start_date: "", end_date: "" };
                setFilterInput(reset);
                setFilters(reset);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border"
              title="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        {canCreate && (
          <button
            type="button"
            onClick={() => setFormMeeting(null)}
            className="inline-flex h-9 items-center rounded-md bg-color-primary px-3 text-sm font-medium text-color-primary-foreground"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-color-border px-4 py-8 text-center text-sm text-color-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Memuat meeting project...
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-color-border px-4 py-10 text-center text-sm text-color-muted-foreground">
          <CalendarClock className="mx-auto mb-2 h-8 w-8 opacity-50" />
          Belum ada meeting di project ini.
        </div>
      ) : (
        <>
          {renderGroup("Mendatang", grouped.upcoming)}
          {renderGroup("Selesai / Lewat", grouped.past)}
        </>
      )}

      {formMeeting !== undefined && (
        <MeetingFormModal
          projectId={projectId}
          members={members}
          meeting={formMeeting}
          onClose={() => setFormMeeting(undefined)}
          onSaved={(meeting, message) => {
            onNotice({ type: "success", msg: message ?? "Meeting berhasil disimpan." });
            setFormMeeting(undefined);
            setSelectedMeeting(meeting);
            void loadMeetings();
          }}
          onError={(message) => onNotice({ type: "error", msg: message })}
        />
      )}

      {selectedMeeting && (
        <MeetingDetailModal
          projectId={projectId}
          meeting={selectedMeeting}
          employees={employees}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setSelectedMeeting(null)}
          onEdit={(meeting) => {
            setSelectedMeeting(null);
            setFormMeeting(meeting);
          }}
          onChanged={(meeting) => {
            if (meeting) setSelectedMeeting(meeting);
            void loadMeetings();
          }}
          onNotice={onNotice}
        />
      )}
    </div>
  );
}
