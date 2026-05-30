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
  const notificationRef = useRef<HTMLDivElement | null>(null);
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
      const target = event.target as Node;
      if (quickCreateRef.current && !quickCreateRef.current.contains(target)) {
        setIsQuickCreateOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
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
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden text-[var(--ink)]">

      {/* Left Sidebar */}
      <aside className={`bg-[var(--panel)] text-[var(--ink)] flex flex-col shrink-0 transition-all duration-300 border-r border-[var(--border)] ${isSidebarMinimized ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center font-bold text-lg tracking-tight border-b border-[var(--border)] ${isSidebarMinimized ? "justify-between px-1.5" : "justify-between px-4"}`}>
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
            className={`inline-flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--ink-3)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors ${isSidebarMinimized ? "h-7 w-7" : "h-8 w-8"}`}
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
                  className={`w-full rounded-md border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors ${
                    isSidebarMinimized ? "h-10 flex items-center justify-center" : "px-3 py-2.5"
                  }`}
                  title="Buat Baru"
                >
                  <span className={`inline-flex items-center ${isSidebarMinimized ? "" : "gap-2"}`}>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-sm font-bold leading-none">
                      +
                    </span>
                    {!isSidebarMinimized && <span className="text-xs font-bold tracking-wide">BUAT BARU</span>}
                  </span>
                </button>
                {isQuickCreateOpen && (
                <div
                  className="fixed z-50 w-56 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card)] shadow-xl"
                  style={{ top: quickCreatePosition.top, left: quickCreatePosition.left }}
                >
                  {canCreateProjects && (
                    <Link
                      to="/proyek/list?create=project"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                    >
                      <FolderKanban className="h-4 w-4 text-[var(--accent)]" />
                      Proyek Baru
                    </Link>
                  )}
                  {canCreateTasks && (
                    <Link
                      to="/tugas-saya?create=task"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                    >
                      <ClipboardList className="h-4 w-4 text-[var(--accent)]" />
                      Tugas Baru
                    </Link>
                  )}
                  {canCreateIssues && (
                    <Link
                      to="/isu/list?create=issue"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                    >
                      <Bug className="h-4 w-4 text-[var(--accent)]" />
                      Issue Baru
                    </Link>
                  )}
                  {canCreateTasks && (
                    <Link
                      to="/tugas-saya?tab=timesheets&create=timesheet"
                      onClick={() => setIsQuickCreateOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                    >
                      <FileClock className="h-4 w-4 text-[var(--accent)]" />
                      Timesheet Baru
                    </Link>
                  )}
                </div>
              )}
              </div>
            )}

            {canViewDashboard && (
              <Link to="/" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`}>
                <Home className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Beranda"}
              </Link>
            )}

            {canViewCalendar && (
              <Link
                to="/proyek/monitoring"
                className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`}
                title="Kalender"
              >
                <CalendarRange className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Kalender"}
              </Link>
            )}

            {!isSidebarMinimized && (
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider">Modul</p>
              </div>
            )}

            {isSidebarMinimized && <div className="pt-2" />}

            {canViewTasks && (
              <Link
                to="/tugas-saya"
                className={`${navItemClass} relative text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`}
                title={
                  assignmentCounter.total_active > 0
                    ? `Tugas aktif: ${assignmentCounter.active_tasks}, Isu aktif: ${assignmentCounter.active_issues}`
                    : "Tugas Saya"
                }
              >
                <span className="relative inline-flex">
                  <ListTodo className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                  {assignmentCounter.total_active > 0 && isSidebarMinimized && (
                    <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold leading-none text-white">
                      {assignmentCounter.total_active > 9 ? "9+" : assignmentCounter.total_active}
                    </span>
                  )}
                </span>
                {!isSidebarMinimized && (
                  <>
                    <span className="min-w-0 flex-1">Tugas Saya</span>
                    {assignmentCounter.total_active > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold leading-none text-white">
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
                <Link to="/proyek/list" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Proyek">
                  <FolderKanban className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                  {!isSidebarMinimized && "Proyek"}
                </Link>
              </>
            )}

            {canViewIssues && (
              <Link to="/isu/list" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Isu & Bug">
                <Bug className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Isu & Bug"}
              </Link>
            )}

            {canViewWorkload && (
              <Link to="/sdm/workload" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="SDM & Kapabilitas">
                <Users className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "SDM & Kapabilitas"}
              </Link>
            )}

            {/* Master submenu */}
            {canViewAnyMaster && isSidebarMinimized ? (
              <>
                <div className="pt-2" />
                {canViewMasterEmployees && (
                  <Link to="/master/pegawai" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Master - Pegawai">
                    <User className="w-5 h-5" />
                  </Link>
                )}
                {canViewMasterRoles && (
                  <Link to="/master/role" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Master - Role">
                    <Shield className="w-5 h-5" />
                  </Link>
                )}
                {canViewMasterOrganizations && (
                  <Link to="/master/organisasi" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Master - Organisasi">
                    <Building2 className="w-5 h-5" />
                  </Link>
                )}
                {canViewMasterUnits && (
                  <Link to="/master/unit-organisasi" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Master - Unit Organisasi">
                    <Network className="w-5 h-5" />
                  </Link>
                )}
                {canViewMasterPositions && (
                  <Link to="/master/jabatan" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Master - Jabatan">
                    <BriefcaseBusiness className="w-5 h-5" />
                  </Link>
                )}
              </>
            ) : canViewAnyMaster ? (
              <div className="mt-1">
                {!isSidebarMinimized && (
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider">Master Data</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsMasterMenuOpen((current) => !current)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)] transition-colors"
                >
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-3" />
                    Data Master
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMasterMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isMasterMenuOpen && (
                  <div className="mt-1 pl-11 pr-2">
                    {canViewMasterEmployees && (
                      <Link
                        to="/master/pegawai"
                        className="flex items-center px-3 py-1.5 text-sm rounded-md text-[var(--ink-2)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Pegawai
                      </Link>
                    )}
                    {canViewMasterRoles && (
                      <Link
                        to="/master/role"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-[var(--ink-2)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Role
                      </Link>
                    )}
                    {canViewMasterOrganizations && (
                      <Link
                        to="/master/organisasi"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-[var(--ink-2)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Organisasi
                      </Link>
                    )}
                    {canViewMasterUnits && (
                      <Link
                        to="/master/unit-organisasi"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-[var(--ink-2)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <Network className="w-4 h-4 mr-2" />
                        Unit Organisasi
                      </Link>
                    )}
                    {canViewMasterPositions && (
                      <Link
                        to="/master/jabatan"
                        className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-[var(--ink-2)] hover:text-[var(--accent)] hover:bg-[var(--bg)] transition-colors"
                      >
                        <BriefcaseBusiness className="w-4 h-4 mr-2" />
                        Jabatan
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {(canViewEmailPreferences || canViewEmailLogs) && (
              <div className="pt-3 pb-1">
                {!isSidebarMinimized && <p className="px-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wider">Pengaturan</p>}
              </div>
            )}
            {canViewEmailPreferences && (
              <Link to="/pengaturan/email" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Notifikasi Email">
                <Mail className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Notifikasi Email"}
              </Link>
            )}
            {canViewEmailLogs && (
              <Link to="/admin/email-log" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`} title="Email Log">
                <Shield className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Email Log"}
              </Link>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <Link to="/profile" className={`${navItemClass} text-[var(--ink-2)] hover:bg-[var(--bg)] hover:text-[var(--accent)]`}>
            <User className={`w-5 h-5 ${isSidebarMinimized ? "" : "mr-3"}`} />
            {!isSidebarMinimized && "Profile"}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 z-10">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              aria-label={themeMode === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode"}
              title={themeMode === "dark" ? "Light mode" : "Dark mode"}
            >
              {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenOnboarding}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--ink-3)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              aria-label="Buka materi onboarding"
              title="Materi onboarding"
            >
              <CircleHelp className="h-4 w-4" />
            </button>

            <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen((current) => !current)}
              className="relative text-[var(--ink-3)] hover:text-[var(--ink)]"
              aria-label="Buka notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-[var(--accent)] text-white text-[10px] leading-4 text-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-9 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Notifikasi</p>
                    <p className="text-xs text-[var(--ink-3)]">{unreadCount} belum dibaca</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate("/notifications");
                      }}
                      className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)]"
                    >
                      Lihat semua
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
                      disabled={unreadCount === 0}
                    >
                      Tandai dibaca
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notificationError && (
                    <div className="px-4 py-3 text-sm text-[var(--accent)] bg-[var(--accent-soft)]">{notificationError}</div>
                  )}

                  {!notificationError && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-[var(--ink-3)]">
                      Belum ada notifikasi.
                    </div>
                  )}

                  {!notificationError &&
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleNotificationClick(notification)}
                        className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg)] ${
                          notification.is_read ? "bg-[var(--card)]" : "bg-[var(--accent-soft)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                              notification.is_read ? "bg-[var(--ink-3)]" : "bg-[var(--accent)]"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--ink)] truncate">{notification.title}</p>
                            <p className="text-xs text-[var(--ink-2)] mt-0.5 line-clamp-2">{notification.message}</p>
                            <p className="text-[11px] text-[var(--ink-3)] mt-1">
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
              <p className="text-sm font-semibold text-[var(--ink)] leading-none">{session.name}</p>
              <p className="text-xs text-[var(--ink-3)] mt-1 leading-none">{session.email}</p>
            </div>

            <button className="w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold flex items-center justify-center text-sm border border-[var(--accent)]">
              {session.initials}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--ink-2)] hover:bg-[var(--bg)]"
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
