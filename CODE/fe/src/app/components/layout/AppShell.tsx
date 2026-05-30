import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router";
import {
  Bell,
  Home,
  Bug,
  FolderKanban,
  Building2,
  Network,
  User,
  Users,
  Shield,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ListTodo,
  ClipboardList,
  LogOut,
  Moon,
  Sun,
  CalendarRange,
  Mail,
  FileClock,
  CircleHelp
} from "lucide-react";
import type { AuthSession } from "../../data/auth";
import type { ThemeMode } from "../../utils/theme";
import { hasPermission } from "../../utils/permissions";
import {
  fetchMyAssignmentCounter,
  fetchMyProjects,
  type MyAssignmentCounterResponse,
  type MyProjectResponse
} from "../../services/authApi";
import { fetchMyTimesheets } from "../../services/timesheetApi";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification
} from "../../services/notificationApi";
import appLogo from "../../../styles/LOGO-IGLO-v.3-with-indocyber-square.png";

export type AppShellProps = {
  session: AuthSession;
  onLogout: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenOnboarding: () => void;
};

function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActiveProjects(projects: MyProjectResponse[]) {
  return projects.filter((project) => project.status === "Active");
}

export function AppShell({ session, onLogout, themeMode, onToggleTheme, onOpenOnboarding }: AppShellProps) {
  const navigate = useNavigate();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreatePosition, setQuickCreatePosition] = useState({ top: 0, left: 0 });
  const quickCreateRef = useRef<HTMLDivElement | null>(null);
  const quickCreateButtonRef = useRef<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [assignmentCounter, setAssignmentCounter] = useState<MyAssignmentCounterResponse>({
    active_tasks: 0,
    active_issues: 0,
    total_active: 0
  });
  const [timesheetReminder, setTimesheetReminder] = useState({ shouldShow: false, activeProjectCount: 0 });
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const navItemClass = `flex items-center py-2 text-sm font-medium rounded-md transition-colors ${
    isSidebarMinimized ? "justify-center px-2" : "px-3"
  }`;
  const canViewDashboard = hasPermission(session, "dashboard", "view");
  const canViewCalendar = hasPermission(session, "calendar", "view");
  const canViewTasks = hasPermission(session, "tasks", "view");
  const canCreateTasks = hasPermission(session, "tasks", "create");
  const canViewProjects =
    hasPermission(session, "masterProjects", "view") ||
    hasPermission(session, "projectMembers", "view") ||
    hasPermission(session, "projectTasks", "view") ||
    hasPermission(session, "projectGantt", "view") ||
    hasPermission(session, "projectTimesheets", "view") ||
    hasPermission(session, "projectAttachments", "view") ||
    hasPermission(session, "projectMeetings", "view");
  const canCreateProjects = hasPermission(session, "masterProjects", "create");
  const canViewIssues = hasPermission(session, "issues", "view");
  const canCreateIssues = hasPermission(session, "issues", "create");
  const canViewWorkload = hasPermission(session, "workload", "view");
  const canViewMasterEmployees = hasPermission(session, "masterEmployees", "view");
  const canViewMasterRoles = hasPermission(session, "masterRoles", "view");
  const canViewMasterOrganizations = hasPermission(session, "masterOrganizations", "view");
  const canViewMasterUnits = hasPermission(session, "masterOrganizationUnits", "view");
  const canViewMasterPositions = hasPermission(session, "masterPositions", "view");
  const canViewEmailPreferences = hasPermission(session, "emailPreferences", "view");
  const canViewEmailLogs = hasPermission(session, "adminEmailLogs", "view");
  const canViewAnyMaster =
    canViewMasterEmployees ||
    canViewMasterRoles ||
    canViewMasterOrganizations ||
    canViewMasterUnits ||
    canViewMasterPositions;
  const canUseQuickCreate = canCreateProjects || canCreateTasks || canCreateIssues;

  const loadNotifications = async () => {
    try {
      const payload = await fetchNotifications();
      setNotifications(payload.items);
      setUnreadCount(payload.unread_count);
      setNotificationError(null);
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Gagal memuat notifikasi.");
    }
  };

  const loadAssignmentCounter = async () => {
    try {
      const payload = await fetchMyAssignmentCounter();
      setAssignmentCounter(payload);
    } catch {
      setAssignmentCounter({ active_tasks: 0, active_issues: 0, total_active: 0 });
    }
  };

  const loadTimesheetReminder = async () => {
    if (!canViewTasks) {
      setTimesheetReminder({ shouldShow: false, activeProjectCount: 0 });
      return;
    }

    const today = toLocalDateKey();
    try {
      const [projectRows, todayTimesheets] = await Promise.all([
        fetchMyProjects({ member_only: true }),
        fetchMyTimesheets({ start_date: today, end_date: today })
      ]);
      const activeProjects = getActiveProjects(projectRows);
      setTimesheetReminder({
        activeProjectCount: activeProjects.length,
        shouldShow: activeProjects.length > 0 && todayTimesheets.length === 0
      });
    } catch {
      setTimesheetReminder({ shouldShow: false, activeProjectCount: 0 });
    }
  };

  useEffect(() => {
    void loadNotifications();
    void loadAssignmentCounter();
    void loadTimesheetReminder();
    const interval = window.setInterval(() => {
      void loadNotifications();
      void loadAssignmentCounter();
      void loadTimesheetReminder();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [session.userId, session.accessToken, canViewTasks]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!quickCreateRef.current) return;
      if (quickCreateRef.current.contains(event.target as Node)) return;
      setIsQuickCreateOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isQuickCreateOpen) return;

    const updateQuickCreatePosition = () => {
      if (!quickCreateButtonRef.current) return;
      const rect = quickCreateButtonRef.current.getBoundingClientRect();
      const popupWidth = 224;
      const popupHeight = 184;
      const gap = 8;

      let left = rect.right + gap;
      let top = rect.top;

      if (left + popupWidth > window.innerWidth - 8) {
        left = Math.max(8, rect.left - popupWidth - gap);
      }
      if (top + popupHeight > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - popupHeight - 8);
      }

      setQuickCreatePosition({ top, left });
    };

    updateQuickCreatePosition();
    window.addEventListener("resize", updateQuickCreatePosition);
    window.addEventListener("scroll", updateQuickCreatePosition, true);
    return () => {
      window.removeEventListener("resize", updateQuickCreatePosition);
      window.removeEventListener("scroll", updateQuickCreatePosition, true);
    };
  }, [isQuickCreateOpen, isSidebarMinimized]);

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
    }
    setIsNotificationOpen(false);
    await loadNotifications();
    if (notification.target_url) {
      navigate(notification.target_url);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications();
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900">

      {/* Left Sidebar (Dark Indigo) */}
      <aside className={`bg-indigo-950 text-indigo-100 flex flex-col shrink-0 transition-all duration-300 ${isSidebarMinimized ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center font-bold text-lg tracking-tight border-b border-indigo-900 ${isSidebarMinimized ? "justify-between px-1.5" : "justify-between px-4"}`}>
          <div className="flex items-center min-w-0">
            <img
              src={appLogo}
              alt="IGLO Indocyber"
              className={`${isSidebarMinimized ? "h-7 w-7" : "mr-3 h-8 w-8"} rounded-md bg-white object-contain p-0.5`}
            />
            {!isSidebarMinimized && <span className="truncate">PM Dashboard</span>}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarMinimized((current) => !current)}
            aria-label={isSidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
            className={`inline-flex items-center justify-center rounded-md border border-indigo-800 text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors ${isSidebarMinimized ? "h-7 w-7" : "h-8 w-8"}`}
            title={isSidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
          >
            {isSidebarMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto overflow-x-visible py-4 pr-1">
          <nav className="space-y-1 px-3">
            {canUseQuickCreate && (
              <div className="relative mb-2" ref={quickCreateRef}>
                <button
                  type="button"
                  ref={quickCreateButtonRef}
                  onClick={() => setIsQuickCreateOpen((current) => !current)}
                  className={`w-full rounded-md border border-indigo-600/60 bg-indigo-700/35 text-indigo-100 hover:bg-indigo-600/50 transition-colors ${
                    isSidebarMinimized ? "h-10 flex items-center justify-center" : "px-3 py-2.5"
                  }`}
                  title="Buat Baru"
                >
                  <span className={`inline-flex items-center ${isSidebarMinimized ? "" : "gap-2"}`}>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300/80 text-indigo-100 text-sm font-bold leading-none">
                      +
                    </span>
                    {!isSidebarMinimized && <span className="text-xs font-bold tracking-wide">BUAT BARU</span>}
                  </span>
                </button>
                {isQuickCreateOpen && (
                <div
                  className="fixed z-50 w-56 overflow-hidden rounded-md border border-indigo-800 bg-indigo-950 shadow-xl"
                  style={{ top: quickCreatePosition.top, left: quickCreatePosition.left }}
                >
                  {canCreateProjects && (
                    <Link
                      to="/proyek/list?create=project"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-100 hover:bg-indigo-900"
                    >
                      <FolderKanban className="h-4 w-4 text-indigo-300" />
                      Proyek Baru
                    </Link>
                  )}
                  {canCreateTasks && (
                    <Link
                      to="/tugas-saya?create=task"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-100 hover:bg-indigo-900"
                    >
                      <ClipboardList className="h-4 w-4 text-indigo-300" />
                      Tugas Baru
                    </Link>
                  )}
                  {canCreateIssues && (
                    <Link
                      to="/isu/list?create=issue"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-100 hover:bg-indigo-900"
                    >
                      <Bug className="h-4 w-4 text-indigo-300" />
                      Issue Baru
                    </Link>
                  )}
                  {canCreateTasks && (
                    <Link
                      to="/tugas-saya?tab=timesheets&create=timesheet"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-100 hover:bg-indigo-900"
                    >
                      <FileClock className="h-4 w-4 text-indigo-300" />
                      Timesheet Baru
                    </Link>
                  )}
                </div>
              )}
              </div>
            )}

            {canViewDashboard && (
              <Link to="/" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
                <Home className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Beranda"}
              </Link>
            )}

            {canViewCalendar && (
              <Link
                to="/proyek/monitoring"
                className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}
                title="Kalender"
              >
                <CalendarRange className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Kalender"}
              </Link>
            )}

            {!isSidebarMinimized && (
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Modul</p>
              </div>
            )}

            {isSidebarMinimized && <div className="pt-2" />}

            {canViewTasks && (
              <Link
                to="/tugas-saya"
                className={`${navItemClass} relative hover:bg-indigo-900 hover:text-white`}
                title={
                  assignmentCounter.total_active > 0
                    ? `Tugas aktif: ${assignmentCounter.active_tasks}, Isu aktif: ${assignmentCounter.active_issues}`
                    : "Tugas Saya"
                }
              >
                <span className="relative inline-flex">
                  <ListTodo className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                  {assignmentCounter.total_active > 0 && isSidebarMinimized && (
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                      {assignmentCounter.total_active > 9 ? "9+" : assignmentCounter.total_active}
                    </span>
                  )}
                </span>
                {!isSidebarMinimized && (
                  <>
                    <span className="min-w-0 flex-1">Tugas Saya</span>
                    {assignmentCounter.total_active > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                        <Bell className="h-3 w-3" />
                        {assignmentCounter.total_active}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )}

            {canViewProjects && (
              <>
                <Link to="/proyek/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Proyek">
                  <FolderKanban className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                  {!isSidebarMinimized && "Proyek"}
                </Link>
              </>
            )}

            {canViewIssues && (
              <Link to="/isu/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Isu & Bug">
                <Bug className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Isu & Bug"}
              </Link>
            )}

            {canViewWorkload && (
              <Link to="/sdm/workload" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="SDM & Kapabilitas">
                <Users className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "SDM & Kapabilitas"}
              </Link>
            )}

            {/* Master submenu */}
            {canViewAnyMaster && isSidebarMinimized ? (
              <>
                <div className="pt-2" />
                {canViewMasterEmployees && (
                  <Link to="/master/pegawai" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Pegawai">
                    <User className="w-5 h-5 opacity-75" />
                  </Link>
                )}
                {canViewMasterRoles && (
                  <Link to="/master/role" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Role">
                    <Shield className="w-5 h-5 opacity-75" />
                  </Link>
                )}
                {canViewMasterOrganizations && (
                  <Link to="/master/organisasi" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Organisasi">
                    <Building2 className="w-5 h-5 opacity-75" />
                  </Link>
                )}
                {canViewMasterUnits && (
                  <Link to="/master/unit-organisasi" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Unit Organisasi">
                    <Network className="w-5 h-5 opacity-75" />
                  </Link>
                )}
                {canViewMasterPositions && (
                  <Link to="/master/jabatan" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Jabatan">
                    <BriefcaseBusiness className="w-5 h-5 opacity-75" />
                  </Link>
                )}
              </>
            ) : canViewAnyMaster ? (
              <div className="mt-1">
                {!isSidebarMinimized && (
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Master Data</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsMasterMenuOpen((current) => !current)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-indigo-900 hover:text-white transition-colors"
                >
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-3 opacity-75" />
                    Data Master
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMasterMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isMasterMenuOpen && (
                  <div className="mt-1 pl-11 pr-2">
                    {canViewMasterEmployees && (
                      <Link
                        to="/master/pegawai"
                        className="flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2 opacity-80" />
                        Pegawai
                      </Link>
                    )}
                    {canViewMasterRoles && (
                      <Link
                        to="/master/role"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-2 opacity-80" />
                        Role
                      </Link>
                    )}
                    {canViewMasterOrganizations && (
                      <Link
                        to="/master/organisasi"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                      >
                        <Building2 className="w-4 h-4 mr-2 opacity-80" />
                        Organisasi
                      </Link>
                    )}
                    {canViewMasterUnits && (
                      <Link
                        to="/master/unit-organisasi"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                      >
                        <Network className="w-4 h-4 mr-2 opacity-80" />
                        Unit Organisasi
                      </Link>
                    )}
                    {canViewMasterPositions && (
                      <Link
                        to="/master/jabatan"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                      >
                        <BriefcaseBusiness className="w-4 h-4 mr-2 opacity-80" />
                        Jabatan
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {(canViewEmailPreferences || canViewEmailLogs) && (
              <div className="pt-3 pb-1">
                {!isSidebarMinimized && <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Pengaturan</p>}
              </div>
            )}
            {canViewEmailPreferences && (
              <Link to="/pengaturan/email" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Notifikasi Email">
                <Mail className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Notifikasi Email"}
              </Link>
            )}
            {canViewEmailLogs && (
              <Link to="/admin/email-log" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Email Log">
                <Shield className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Email Log"}
              </Link>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-indigo-900">
          <Link to="/profile" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
            <User className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
            {!isSidebarMinimized && "Profile"}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex min-w-0 items-center">
            {timesheetReminder.shouldShow && (
              <Link
                to="/tugas-saya?tab=timesheets&create=timesheet"
                className="inline-flex h-9 max-w-full items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                title="Belum isi timesheet hari ini untuk project aktif"
              >
                <FileClock className="h-4 w-4 shrink-0" />
                <span className="hidden truncate sm:inline">Isi timesheet hari ini</span>
                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[11px] font-bold leading-none text-white">
                  {timesheetReminder.activeProjectCount > 9 ? "9+" : timesheetReminder.activeProjectCount}
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label={themeMode === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode"}
              title={themeMode === "dark" ? "Light mode" : "Dark mode"}
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenOnboarding}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Buka materi onboarding"
              title="Materi onboarding"
            >
              <CircleHelp className="h-4 w-4" />
            </button>

            <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((current) => !current)}
              className="relative text-slate-500 hover:text-slate-700"
              aria-label="Buka notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-9 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
                    <p className="text-xs text-slate-500">{unreadCount} belum dibaca</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate("/notifications");
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Lihat semua
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                      disabled={unreadCount === 0}
                    >
                      Tandai dibaca
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationError && (
                    <div className="px-4 py-3 text-sm text-red-600 bg-red-50">{notificationError}</div>
                  )}

                  {!notificationError && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Belum ada notifikasi.
                    </div>
                  )}

                  {!notificationError &&
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                          notification.is_read ? "bg-white" : "bg-indigo-50/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                              notification.is_read ? "bg-slate-300" : "bg-indigo-600"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{notification.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {new Date(notification.created_at).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
            </div>

            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-slate-800 leading-none">{session.name}</p>
              <p className="text-xs text-slate-500 mt-1 leading-none">{session.email}</p>
            </div>

            <button className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
              {session.initials}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content View */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
