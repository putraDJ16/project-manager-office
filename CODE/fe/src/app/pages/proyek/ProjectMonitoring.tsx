import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Activity, AlertCircle, CalendarDays, Clock, Flag, FolderKanban, Loader2, Users } from "lucide-react";
import { fetchProjects, type ApiProject } from "../../services/projectApi";

type CalendarView = "day" | "week" | "month";
type ProjectMarkerType = "start" | "end";

type ProjectMarker = {
  project: ApiProject;
  type: ProjectMarkerType;
};

type ProjectDetailPopup = {
  project: ApiProject;
  type: ProjectMarkerType;
  date: Date;
};

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Harian",
  week: "Mingguan",
  month: "Bulanan"
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-color-status-success-surface text-color-status-success border-color-status-success-border",
  Planning: "bg-color-status-info-surface text-color-status-info border-color-status-info-border",
  "On Hold": "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border",
  Completed: "bg-color-secondary text-color-muted-foreground border-color-border"
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-color-destructive/15 text-color-destructive border-color-destructive/40",
  High: "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border",
  Medium: "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border",
  Low: "bg-color-status-success-surface text-color-status-success border-color-status-success-border"
};

const PROJECT_COLOR_PALETTE = [
  "#4f46e5",
  "#0ea5e9",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#be123c"
];

const MARKER_STYLES: Record<ProjectMarkerType, string> = {
  start: "bg-color-status-success",
  end: "bg-color-destructive"
};

const MARKER_BADGES: Record<ProjectMarkerType, string> = {
  start: "bg-color-status-success-surface text-color-status-success border-color-status-success-border",
  end: "bg-color-destructive/15 text-color-destructive border-color-destructive/40"
};

const COMPLETED_DEADLINE_BADGE = "bg-color-secondary text-color-muted-foreground border-color-border";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatReadableDate(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function isHexColor(value: string | null | undefined) {
  return Boolean(value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value));
}

function expandHexColor(color: string) {
  if (color.length === 4) return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  return color;
}

function hexToRgba(color: string, alpha: number) {
  const hex = expandHexColor(color).slice(1);
  const value = Number.parseInt(hex, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function getProjectColor(project: ApiProject) {
  const explicitColor = project.color ?? project.project_color;
  if (isHexColor(explicitColor)) return expandHexColor(explicitColor as string);
  return PROJECT_COLOR_PALETTE[Math.abs(hashString(project.id || project.name)) % PROJECT_COLOR_PALETTE.length];
}

function getProjectMarkerStyle(project: ApiProject): CSSProperties {
  const color = getProjectColor(project);
  return {
    borderLeftColor: color,
    boxShadow: `inset 3px 0 0 ${color}`,
    background: `linear-gradient(90deg, ${hexToRgba(color, 0.16)} 0%, ${hexToRgba(color, 0.08)} 48%, transparent 100%)`
  };
}

function getProgress(project: ApiProject) {
  if (project.status === "Completed") return 100;
  const start = parseDate(project.start_date);
  const end = parseDate(project.end_date);
  if (!start || !end) return project.status === "Active" ? 45 : 15;

  const now = new Date();
  const total = end.getTime() - start.getTime();
  if (total <= 0) return project.status === "Completed" ? 100 : 0;
  const elapsed = now.getTime() - start.getTime();
  return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getProjectMarkers(project: ApiProject, date: Date, _view: CalendarView): ProjectMarker[] {
  const start = parseDate(project.start_date);
  const end = parseDate(project.end_date);
  const markers: ProjectMarker[] = [];

  if (start && isSameDay(start, date)) markers.push({ project, type: "start" });
  if (end && isSameDay(end, date)) markers.push({ project, type: "end" });

  return markers;
}

function getWeekDates(date: Date) {
  const first = new Date(date);
  first.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(first);
    day.setDate(first.getDate() + index);
    return day;
  });
}

function getMonthDates(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstCalendarDate = new Date(firstOfMonth);
  firstCalendarDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstCalendarDate);
    day.setDate(firstCalendarDate.getDate() + index);
    return day;
  });
}

function shiftDate(date: Date, view: CalendarView, direction: number) {
  const next = new Date(date);
  if (view === "day") next.setDate(next.getDate() + direction);
  if (view === "week") next.setDate(next.getDate() + direction * 7);
  if (view === "month") next.setMonth(next.getMonth() + direction);
  return next;
}

function getMarkerLabel(type: ProjectMarkerType, project?: ApiProject) {
  if (type === "start") return "Mulai";
  if (project?.status === "Completed") return "Deadline Selesai";
  return "Deadline Aktif";
}

function getMarkerBadgeClass(marker: ProjectMarker) {
  if (marker.type === "end" && marker.project.status === "Completed") return COMPLETED_DEADLINE_BADGE;
  return MARKER_BADGES[marker.type];
}

function getMarkerDotClass(marker: ProjectMarker) {
  if (marker.type === "end" && marker.project.status === "Completed") return "bg-color-muted-foreground";
  return MARKER_STYLES[marker.type];
}

function getDateSummary(projects: ApiProject[], date: Date) {
  const starts = projects.filter((project) => {
    const start = parseDate(project.start_date);
    return start ? isSameDay(start, date) : false;
  });
  const deadlines = projects.filter((project) => {
    const end = parseDate(project.end_date);
    return end ? isSameDay(end, date) : false;
  });
  const activeDeadlines = deadlines.filter((project) => project.status !== "Completed");
  const completedDeadlines = deadlines.filter((project) => project.status === "Completed");

  return { starts, deadlines, activeDeadlines, completedDeadlines };
}

function getPeriodLabel(date: Date, view: CalendarView) {
  if (view === "day") {
    return date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  if (view === "week") {
    const week = getWeekDates(date);
    return `${formatReadableDate(week[0])} - ${formatReadableDate(week[6])}`;
  }

  return formatMonthYear(date);
}

function MarkerLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-color-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-2.5 w-7 overflow-hidden rounded-full">
          {PROJECT_COLOR_PALETTE.slice(0, 4).map((color) => (
            <span key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
          ))}
        </span>
        Warna proyek
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-color-status-success" />
        Mulai
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-color-destructive" />
        Deadline Aktif
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-color-muted-foreground" />
        Deadline Selesai
      </span>
    </div>
  );
}

function ProjectAgendaItem({ marker }: { marker: ProjectMarker }) {
  const { project, type } = marker;
  const icon = type === "start" ? <CalendarDays className="h-4 w-4 text-color-status-success" /> : <Flag className="h-4 w-4 text-color-destructive" />;
  const label = getMarkerLabel(type, project);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-l-4 border-color-border bg-color-card p-3 shadow-sm" style={{ borderLeftColor: getProjectColor(project) }}>
      <div className="mt-0.5 rounded-lg bg-color-secondary p-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-color-foreground">{project.name}</p>
            <p className="mt-1 text-xs text-color-muted-foreground">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[project.status] ?? STATUS_COLORS.Planning}`}>
            {project.status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-color-border bg-color-secondary px-2 py-0.5 text-xs font-semibold text-color-muted-foreground">
            {label}
          </span>
          {project.priority && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.Medium}`}>
              {project.priority}
            </span>
          )}
          <span className="rounded-full border border-color-border bg-color-secondary px-2 py-0.5 text-xs font-semibold text-color-muted-foreground">
            {project.member_count} anggota
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProjectMonitoring() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectDetailPopup | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProjects()
      .then((items) => setProjects(items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeProjects = useMemo(() => projects.filter((project) => project.status !== "Completed"), [projects]);
  const dueSoonProjects = useMemo(() => {
    const now = new Date();
    const next14Days = new Date();
    next14Days.setDate(now.getDate() + 14);
    return projects.filter((project) => {
      const end = parseDate(project.end_date);
      return end && end >= now && end <= next14Days && project.status !== "Completed";
    });
  }, [projects]);

  const calendarDates = useMemo(() => {
    if (calendarView === "day") return [anchorDate];
    if (calendarView === "week") return getWeekDates(anchorDate);
    return getMonthDates(anchorDate);
  }, [anchorDate, calendarView]);

  const markersByDate = useMemo(
    () =>
      calendarDates.map((date) => ({
        date,
        markers: projects.flatMap((project) => getProjectMarkers(project, date, calendarView))
      })),
    [calendarDates, calendarView, projects]
  );

  const selectedAgenda = useMemo(
    () =>
      markersByDate
        .filter(({ date }) => (calendarView === "month" ? date.getMonth() === anchorDate.getMonth() : true))
        .flatMap(({ date, markers }) => markers.map((marker) => ({ date, marker })))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [anchorDate, calendarView, markersByDate]
  );

  const healthStats = useMemo(
    () => ({
      total: projects.length,
      active: activeProjects.length,
      dueSoon: dueSoonProjects.length,
      members: projects.reduce((sum, project) => sum + project.member_count, 0)
    }),
    [activeProjects.length, dueSoonProjects.length, projects]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-color-border bg-color-card">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-color-primary" />
        <span className="text-sm text-color-muted-foreground">Memuat monitoring proyek...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-color-border bg-color-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-color-primary">Monitoring Proyek</p>
            <h1 className="mt-2 text-2xl font-bold text-color-foreground">Kalender & informasi proyek</h1>
            <p className="mt-2 max-w-2xl text-sm text-color-muted-foreground">
              Kalender fokus ke tanggal mulai dan deadline/end task saja, dengan pembeda deadline aktif dan deadline proyek yang sudah selesai.
            </p>
          </div>

          <div className="flex rounded-lg border border-color-border bg-color-secondary p-1">
            {(Object.keys(VIEW_LABELS) as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  calendarView === view ? "bg-color-primary text-color-primary-foreground shadow-sm" : "text-color-muted-foreground hover:bg-color-card"
                }`}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center rounded-lg border border-color-destructive/40 bg-color-destructive/15 px-4 py-3 text-sm text-color-destructive">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-color-border bg-color-card p-4 shadow-sm">
          <FolderKanban className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <p className="mt-3 text-sm text-color-muted-foreground">Total Proyek</p>
          <p className="text-2xl font-bold text-color-foreground">{healthStats.total}</p>
        </div>
        <div className="rounded-xl border border-color-border bg-color-card p-4 shadow-sm">
          <Activity className="h-5 w-5" style={{ color: "var(--status-success)" }} />
          <p className="mt-3 text-sm text-color-muted-foreground">Aktif</p>
          <p className="text-2xl font-bold text-color-foreground">{healthStats.active}</p>
        </div>
        <div className="rounded-xl border border-color-border bg-color-card p-4 shadow-sm">
          <Clock className="h-5 w-5" style={{ color: "var(--status-warning)" }} />
          <p className="mt-3 text-sm text-color-muted-foreground">Deadline 14 Hari</p>
          <p className="text-2xl font-bold text-color-foreground">{healthStats.dueSoon}</p>
        </div>
        <div className="rounded-xl border border-color-border bg-color-card p-4 shadow-sm">
          <Users className="h-5 w-5" style={{ color: "var(--status-info)" }} />
          <p className="mt-3 text-sm text-color-muted-foreground">Anggota Terlibat</p>
          <p className="text-2xl font-bold text-color-foreground">{healthStats.members}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-color-border bg-color-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-color-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center text-sm font-semibold text-color-foreground">
                <CalendarDays className="mr-2 h-4 w-4 text-color-primary" />
                {getPeriodLabel(anchorDate, calendarView)}
              </div>
              <div className="mt-2">
                <MarkerLegend />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnchorDate((current) => shiftDate(current, calendarView, -1))}
                className="rounded-md border border-color-border px-3 py-1.5 text-sm font-medium text-color-foreground hover:bg-color-secondary"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate(new Date())}
                className="rounded-md border border-color-primary/30 bg-color-primary/10 px-3 py-1.5 text-sm font-medium text-color-primary hover:bg-color-primary/15"
              >
                Hari ini
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate((current) => shiftDate(current, calendarView, 1))}
                className="rounded-md border border-color-border px-3 py-1.5 text-sm font-medium text-color-foreground hover:bg-color-secondary"
              >
                Berikutnya
              </button>
            </div>
          </div>

          {calendarView === "month" && (
            <div className="grid grid-cols-7 border-b border-color-border bg-color-secondary">
              {DAY_NAMES.map((day) => (
                <div key={day} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
          )}

          <div className={`grid ${calendarView === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
            {markersByDate.map(({ date, markers }) => {
              const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
              const isToday = isSameDay(date, new Date());
              const { starts, deadlines, activeDeadlines, completedDeadlines } = getDateSummary(projects, date);
              const visibleMarkers = markers.slice(0, calendarView === "month" ? 2 : 4);
              const hiddenCount = markers.length - visibleMarkers.length;
              const isActiveDate = starts.length > 0 || deadlines.length > 0;

              return (
                <div
                  key={toDateKey(date)}
                  className={`min-h-32 border-b border-r border-color-border p-3 transition-colors ${
                    calendarView === "month" && !isCurrentMonth
                      ? "bg-color-secondary/70 text-color-muted-foreground"
                      : isActiveDate
                        ? "bg-color-primary/10"
                        : "bg-color-card"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-color-primary text-color-primary-foreground" : "text-color-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {calendarView !== "month" && (
                      <span className="text-xs font-medium text-color-muted-foreground">{DAY_NAMES[date.getDay()]}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(starts.length > 0 || deadlines.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {starts.length > 0 && (
                          <span className="rounded-full bg-color-status-success-surface px-1.5 py-0.5 text-xs font-bold text-color-status-success">
                            {starts.length} mulai
                          </span>
                        )}
                        {activeDeadlines.length > 0 && (
                          <span className="rounded-full bg-color-destructive/15 px-1.5 py-0.5 text-xs font-bold text-color-destructive">
                            {activeDeadlines.length} deadline aktif
                          </span>
                        )}
                        {completedDeadlines.length > 0 && (
                          <span className="rounded-full bg-color-accent px-1.5 py-0.5 text-xs font-bold text-color-muted-foreground">
                            {completedDeadlines.length} selesai
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {visibleMarkers.map((marker, index) => (
                        <button
                          key={`${marker.project.id}-${marker.type}-${index}`}
                          type="button"
                          title={`${marker.project.name} - ${getMarkerLabel(marker.type, marker.project)}`}
                          onClick={() =>
                            setSelectedProjectDetail({
                              project: marker.project,
                              type: marker.type,
                              date
                            })
                          }
                          className={`flex w-full items-center gap-1.5 rounded-md border border-l-4 px-1.5 py-1 text-left text-xs font-semibold transition-colors hover:brightness-95 ${getMarkerBadgeClass(marker)}`}
                          style={getProjectMarkerStyle(marker.project)}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full border border-color-card"
                            style={{ backgroundColor: getProjectColor(marker.project) }}
                          />
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${getMarkerDotClass(marker)}`} />
                          <span className="truncate">{getMarkerLabel(marker.type, marker.project)} - {marker.project.name}</span>
                        </button>
                      ))}
                      {hiddenCount > 0 && <p className="text-xs font-semibold text-color-muted-foreground">+{hiddenCount} milestone lain</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-color-border bg-color-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-color-foreground">Agenda proyek</h2>
                <p className="mt-1 text-xs text-color-muted-foreground">Daftar tanggal mulai dan deadline/end task sesuai periode, lengkap status dan prioritas.</p>
              </div>
              <span className="rounded-full bg-color-primary/10 px-2.5 py-1 text-xs font-semibold text-color-primary">
                {selectedAgenda.length}
              </span>
            </div>

            <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
              {selectedAgenda.slice(0, 12).map(({ date, marker }) => (
                <div key={`${toDateKey(date)}-${marker.project.id}-${marker.type}`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">{formatReadableDate(date)}</p>
                  <ProjectAgendaItem marker={marker} />
                </div>
              ))}

              {selectedAgenda.length === 0 && (
                <p className="rounded-lg border border-dashed border-color-border py-8 text-center text-sm text-color-muted-foreground">
                  Belum ada tanggal mulai atau deadline pada periode ini.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-color-border bg-color-card p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-color-foreground">Info proyek aktif</h2>
            <div className="mt-4 space-y-4">
              {activeProjects.slice(0, 4).map((project) => {
                const progress = getProgress(project);
                return (
                  <div key={project.id} className="rounded-xl border border-color-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getProjectColor(project) }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-color-foreground">{project.name}</p>
                          <p className="mt-1 text-xs text-color-muted-foreground">
                            {formatDate(project.start_date)} - {formatDate(project.end_date)}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[project.status] ?? STATUS_COLORS.Planning}`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-color-accent">
                      <div className="h-full rounded-full bg-color-primary" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-color-muted-foreground">
                      <span>{progress}% progress waktu</span>
                      <span>{project.task_count} tugas</span>
                    </div>
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="rounded-lg border border-dashed border-color-border py-8 text-center text-sm text-color-muted-foreground">
                  Belum ada proyek aktif.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-color-border bg-color-card p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-color-foreground">Deadline terdekat</h2>
            <div className="mt-4 space-y-3">
              {dueSoonProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between rounded-lg bg-color-status-warning-surface px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-color-foreground">{project.name}</p>
                    <p className="text-xs text-color-status-warning">Target {formatDate(project.end_date)}</p>
                  </div>
                  <Clock className="h-4 w-4 shrink-0 text-color-status-warning" />
                </div>
              ))}

              {dueSoonProjects.length === 0 && (
                <p className="rounded-lg border border-dashed border-color-border py-6 text-center text-sm text-color-muted-foreground">
                  Tidak ada deadline 14 hari ke depan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedProjectDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.58)" }}
          onClick={() => setSelectedProjectDetail(null)}
        >
          <div
            className="isolate w-full max-w-xl rounded-2xl border border-color-border bg-color-popover p-6 text-color-popover-foreground shadow-2xl"
            style={{ backgroundColor: "var(--popover)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-primary">Detail Proyek</p>
                <h3 className="mt-1 truncate text-lg font-bold text-color-foreground">{selectedProjectDetail.project.name}</h3>
                <p className="mt-1 text-xs text-color-muted-foreground">
                  {getMarkerLabel(selectedProjectDetail.type, selectedProjectDetail.project)} - {formatReadableDate(selectedProjectDetail.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="rounded-md border border-color-border px-3 py-1.5 text-xs font-semibold text-color-foreground hover:bg-color-secondary"
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Tanggal Mulai</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{formatDate(selectedProjectDetail.project.start_date)}</p>
              </div>
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Deadline</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{formatDate(selectedProjectDetail.project.end_date)}</p>
              </div>
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{selectedProjectDetail.project.status}</p>
              </div>
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Prioritas</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{selectedProjectDetail.project.priority ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Jumlah Anggota</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{selectedProjectDetail.project.member_count}</p>
              </div>
              <div className="rounded-lg border border-color-border bg-color-secondary px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-color-muted-foreground">Jumlah Tugas</p>
                <p className="mt-1 text-sm font-semibold text-color-foreground">{selectedProjectDetail.project.task_count}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-color-border p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-color-muted-foreground">
                <span>Progress waktu</span>
                <span className="font-semibold text-color-foreground">{getProgress(selectedProjectDetail.project)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-color-accent">
                <div className="h-full rounded-full bg-color-primary" style={{ width: `${getProgress(selectedProjectDetail.project)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
