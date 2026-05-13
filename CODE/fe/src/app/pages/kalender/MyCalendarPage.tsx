import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import type { CalendarMeeting, RsvpStatus } from "../../domain/meetings";
import { projectCalendarColor } from "../../domain/meetings";
import { fetchMyCalendar } from "../../services/meetingApi";

type CalendarView = "month" | "week" | "day";
type RsvpFilter = "all" | RsvpStatus;

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function rangeFor(view: CalendarView, anchor: Date) {
  if (view === "month") {
    return {
      start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 })
    };
  }
  if (view === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 })
    };
  }
  return { start: startOfDay(anchor), end: startOfDay(anchor) };
}

function rangeLabel(view: CalendarView, anchor: Date) {
  const range = rangeFor(view, anchor);
  if (view === "month") return format(anchor, "MMMM yyyy", { locale: idLocale });
  if (view === "week") return `${format(range.start, "d MMM", { locale: idLocale })} - ${format(range.end, "d MMM yyyy", { locale: idLocale })}`;
  return format(anchor, "EEEE, d MMMM yyyy", { locale: idLocale });
}

function shiftDate(view: CalendarView, anchor: Date, direction: -1 | 1) {
  if (view === "month") return direction > 0 ? addMonths(anchor, 1) : subMonths(anchor, 1);
  if (view === "week") return direction > 0 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
  return addDays(anchor, direction);
}

export function MyCalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarMeeting[]>([]);
  const [knownProjects, setKnownProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeRange = useMemo(() => rangeFor(view, anchorDate), [view, anchorDate]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      setLoading(true);
      try {
        const result = await fetchMyCalendar({
          start_date: dateKey(activeRange.start),
          end_date: dateKey(activeRange.end),
          project_ids: selectedProjectIds
        });
        if (cancelled) return;
        setEvents(result);
        setKnownProjects((current) => {
          const map = new Map(current.map((project) => [project.id, project]));
          result.forEach((event) => map.set(event.project_id, { id: event.project_id, name: event.project_name }));
          return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name, "id"));
        });
        setError(null);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Gagal memuat kalender.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadEvents();
    return () => {
      cancelled = true;
    };
  }, [activeRange.start, activeRange.end, selectedProjectIds.join(",")]);

  const visibleEvents = useMemo(
    () => events.filter((event) => rsvpFilter === "all" || event.my_rsvp === rsvpFilter),
    [events, rsvpFilter]
  );

  const days = useMemo(() => {
    const dayCount = view === "month" ? 42 : view === "week" ? 7 : 1;
    return Array.from({ length: dayCount }, (_, index) => addDays(activeRange.start, index));
  }, [activeRange.start, view]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarMeeting[]>();
    visibleEvents.forEach((event) => {
      const key = dateKey(new Date(event.start_datetime));
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [visibleEvents]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((item) => item !== projectId) : [...current, projectId]
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-color-foreground">
            <CalendarDays className="h-5 w-5 text-color-primary" />
            Kalender
          </h1>
          <p className="mt-1 text-sm text-color-muted-foreground">{rangeLabel(view, anchorDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-3 rounded-lg border border-color-border bg-color-card p-1">
            {(["month", "week", "day"] as CalendarView[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  view === item ? "bg-color-primary/10 text-color-primary" : "text-color-muted-foreground hover:bg-color-secondary"
                }`}
              >
                {item === "month" ? "Bulan" : item === "week" ? "Minggu" : "Hari"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAnchorDate((current) => shiftDate(view, current, -1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border hover:bg-color-secondary"
            title="Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(new Date())}
            className="inline-flex h-9 items-center rounded-md border border-color-border px-3 text-sm hover:bg-color-secondary"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate((current) => shiftDate(view, current, 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-color-border hover:bg-color-secondary"
            title="Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-color-border bg-color-card p-3">
        <select
          value={rsvpFilter}
          onChange={(event) => setRsvpFilter(event.target.value as RsvpFilter)}
          className="h-9 rounded-md border border-color-border px-3 text-sm"
        >
          <option value="all">RSVP: Semua</option>
          <option value="Accepted">RSVP: Accepted</option>
          <option value="Pending">RSVP: Pending</option>
          <option value="Declined">RSVP: Declined</option>
        </select>
        {knownProjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {knownProjects.map((project) => (
              <label key={project.id} className="inline-flex h-9 items-center gap-2 rounded-md border border-color-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedProjectIds.length === 0 || selectedProjectIds.includes(project.id)}
                  onChange={() => {
                    if (selectedProjectIds.length === 0) {
                      setSelectedProjectIds(knownProjects.map((item) => item.id).filter((item) => item !== project.id));
                    } else {
                      toggleProject(project.id);
                    }
                  }}
                />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: projectCalendarColor(project.id) }} />
                {project.name}
              </label>
            ))}
          </div>
        )}
        {selectedProjectIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedProjectIds([])}
            className="h-9 rounded-md border border-color-border px-3 text-sm hover:bg-color-secondary"
          >
            Semua Proyek
          </button>
        )}
      </div>

      {error && <div className="rounded-lg border border-color-destructive/30 bg-color-destructive/10 px-4 py-3 text-sm text-color-destructive">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-color-border bg-color-card">
        {loading ? (
          <div className="flex h-96 items-center justify-center text-sm text-color-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat kalender...
          </div>
        ) : (
          <div className={`grid ${view === "month" ? "grid-cols-7" : view === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
            {view !== "day" &&
              ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((label) => (
                <div key={label} className="border-b border-color-border bg-color-secondary px-3 py-2 text-xs font-semibold text-color-muted-foreground">
                  {label}
                </div>
              ))}
            {days.map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsByDay.get(key) ?? [];
              const muted = view === "month" && !isSameMonth(day, anchorDate);
              return (
                <div key={key} className={`min-h-32 border-b border-r border-color-border p-2 ${muted ? "bg-color-secondary/40" : ""}`}>
                  <div className={`mb-2 text-xs font-semibold ${isSameDay(day, new Date()) ? "text-color-primary" : "text-color-muted-foreground"}`}>
                    {format(day, view === "day" ? "EEEE, d MMMM yyyy" : "d MMM", { locale: idLocale })}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => (
                      <button
                        key={event.meeting_id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="w-full rounded-md px-2 py-1 text-left text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: projectCalendarColor(event.project_id) }}
                      >
                        <span className="block truncate">{format(new Date(event.start_datetime), "HH:mm")} {event.title}</span>
                        <span className="block truncate opacity-90">{event.project_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-lg rounded-xl border border-color-border bg-color-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-color-foreground">{selectedEvent.title}</h2>
                <p className="mt-1 text-sm text-color-muted-foreground">{selectedEvent.project_name}</p>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} className="rounded-md border border-color-border px-2 py-1 text-sm">
                Tutup
              </button>
            </div>
            <div className="space-y-2 text-sm text-color-muted-foreground">
              <p>{format(new Date(selectedEvent.start_datetime), "d MMM yyyy HH:mm", { locale: idLocale })} - {format(new Date(selectedEvent.end_datetime), "HH:mm", { locale: idLocale })}</p>
              <p>Status: {selectedEvent.status}</p>
              <p>RSVP saya: {selectedEvent.my_rsvp ?? "-"}</p>
              {selectedEvent.meeting_url && (
                <a href={selectedEvent.meeting_url} target="_blank" rel="noreferrer" className="inline-flex text-color-primary hover:underline">
                  Buka link meeting
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
