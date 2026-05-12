import { useEffect, useMemo, useState } from "react";
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
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Planning: "bg-blue-50 text-blue-700 border-blue-200",
  "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-slate-50 text-slate-600 border-slate-200"
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Low: "bg-green-50 text-green-700 border-green-200"
};

const MARKER_STYLES: Record<ProjectMarkerType, string> = {
  start: "bg-emerald-500",
  end: "bg-rose-500"
};

const MARKER_BADGES: Record<ProjectMarkerType, string> = {
  start: "bg-emerald-50 text-emerald-700 border-emerald-200",
  end: "bg-rose-50 text-rose-700 border-rose-200"
};

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

function getMarkerLabel(type: ProjectMarkerType) {
  if (type === "start") return "Mulai";
  return "Deadline";
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

  return { starts, deadlines };
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
    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Mulai
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        Deadline / End Task
      </span>
    </div>
  );
}

function ProjectAgendaItem({ marker }: { marker: ProjectMarker }) {
  const { project, type } = marker;
  const icon = type === "start" ? <CalendarDays className="h-4 w-4 text-emerald-600" /> : <Flag className="h-4 w-4 text-rose-600" />;
  const label = getMarkerLabel(type);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mt-0.5 rounded-lg bg-slate-50 p-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[project.status] ?? STATUS_COLORS.Planning}`}>
            {project.status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {label}
          </span>
          {project.priority && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.Medium}`}>
              {project.priority}
            </span>
          )}
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
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
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-sm text-slate-600">Memuat monitoring proyek...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Monitoring Proyek</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Kalender & informasi proyek</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Kalender fokus ke tanggal mulai dan deadline/end task saja. Informasi lain tetap ada di panel samping supaya tampilan bersih dan mudah dipantau.
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(Object.keys(VIEW_LABELS) as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  calendarView === view ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                }`}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <FolderKanban className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">Total Proyek</p>
          <p className="text-2xl font-bold text-slate-900">{healthStats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Activity className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">Aktif</p>
          <p className="text-2xl font-bold text-slate-900">{healthStats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Clock className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm text-slate-500">Deadline 14 Hari</p>
          <p className="text-2xl font-bold text-slate-900">{healthStats.dueSoon}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Users className="h-5 w-5 text-sky-600" />
          <p className="mt-3 text-sm text-slate-500">Anggota Terlibat</p>
          <p className="text-2xl font-bold text-slate-900">{healthStats.members}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center text-sm font-semibold text-slate-900">
                <CalendarDays className="mr-2 h-4 w-4 text-indigo-600" />
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
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate(new Date())}
                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Hari ini
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate((current) => shiftDate(current, calendarView, 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Berikutnya
              </button>
            </div>
          </div>

          {calendarView === "month" && (
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {DAY_NAMES.map((day) => (
                <div key={day} className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {day}
                </div>
              ))}
            </div>
          )}

          <div className={`grid ${calendarView === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
            {markersByDate.map(({ date, markers }) => {
              const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
              const isToday = isSameDay(date, new Date());
              const { starts, deadlines } = getDateSummary(projects, date);
              const visibleMarkers = markers.slice(0, calendarView === "month" ? 2 : 4);
              const hiddenCount = markers.length - visibleMarkers.length;
              const isActiveDate = starts.length > 0 || deadlines.length > 0;

              return (
                <div
                  key={toDateKey(date)}
                  className={`min-h-32 border-b border-r border-slate-100 p-3 transition-colors ${
                    calendarView === "month" && !isCurrentMonth
                      ? "bg-slate-50/70 text-slate-400"
                      : isActiveDate
                        ? "bg-indigo-50/30"
                        : "bg-white"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-indigo-600 text-white" : "text-slate-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {calendarView !== "month" && (
                      <span className="text-xs font-medium text-slate-500">{DAY_NAMES[date.getDay()]}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(starts.length > 0 || deadlines.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {starts.length > 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            {starts.length} mulai
                          </span>
                        )}
                        {deadlines.length > 0 && (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            {deadlines.length} deadline
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      {visibleMarkers.map((marker, index) => (
                        <button
                          key={`${marker.project.id}-${marker.type}-${index}`}
                          type="button"
                          title={`${marker.project.name} - ${getMarkerLabel(marker.type)}`}
                          onClick={() =>
                            setSelectedProjectDetail({
                              project: marker.project,
                              type: marker.type,
                              date
                            })
                          }
                          className={`flex w-full items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[11px] font-semibold transition-colors hover:brightness-95 ${MARKER_BADGES[marker.type]}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${MARKER_STYLES[marker.type]}`} />
                          <span className="truncate">{getMarkerLabel(marker.type)} · {marker.project.name}</span>
                        </button>
                      ))}
                      {hiddenCount > 0 && <p className="text-[11px] font-semibold text-slate-500">+{hiddenCount} milestone lain</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Agenda proyek</h2>
                <p className="mt-1 text-xs text-slate-500">Daftar tanggal mulai dan deadline/end task sesuai periode, lengkap status dan prioritas.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {selectedAgenda.length}
              </span>
            </div>

            <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
              {selectedAgenda.slice(0, 12).map(({ date, marker }) => (
                <div key={`${toDateKey(date)}-${marker.project.id}-${marker.type}`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{formatReadableDate(date)}</p>
                  <ProjectAgendaItem marker={marker} />
                </div>
              ))}

              {selectedAgenda.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                  Belum ada tanggal mulai atau deadline pada periode ini.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Info proyek aktif</h2>
            <div className="mt-4 space-y-4">
              {activeProjects.slice(0, 4).map((project) => {
                const progress = getProgress(project);
                return (
                  <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[project.status] ?? STATUS_COLORS.Planning}`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{progress}% progress waktu</span>
                      <span>{project.task_count} tugas</span>
                    </div>
                  </div>
                );
              })}

              {activeProjects.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                  Belum ada proyek aktif.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">Deadline terdekat</h2>
            <div className="mt-4 space-y-3">
              {dueSoonProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                    <p className="text-xs text-amber-700">Target {formatDate(project.end_date)}</p>
                  </div>
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                </div>
              ))}

              {dueSoonProjects.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                  Tidak ada deadline 14 hari ke depan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedProjectDetail(null)}>
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Detail Proyek</p>
                <h3 className="mt-1 truncate text-lg font-bold text-slate-900">{selectedProjectDetail.project.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {getMarkerLabel(selectedProjectDetail.type)} • {formatReadableDate(selectedProjectDetail.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tanggal Mulai</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(selectedProjectDetail.project.start_date)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(selectedProjectDetail.project.end_date)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedProjectDetail.project.status}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Prioritas</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedProjectDetail.project.priority ?? "-"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jumlah Anggota</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedProjectDetail.project.member_count}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jumlah Tugas</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedProjectDetail.project.task_count}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Progress waktu</span>
                <span className="font-semibold text-slate-700">{getProgress(selectedProjectDetail.project)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${getProgress(selectedProjectDetail.project)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
