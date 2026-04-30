import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router";
import {
  Bell,
  Search,
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
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import type { AuthSession } from "../../data/auth";
import type { ThemeMode } from "../../utils/theme";
import { hasPermission } from "../../utils/permissions";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification
} from "../../services/notificationApi";

type AppShellProps = {
  session: AuthSession;
  onLogout: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
};

export function AppShell({ session, onLogout, themeMode, onToggleTheme }: AppShellProps) {
  const navigate = useNavigate();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const navItemClass = `flex items-center py-2 text-sm font-medium rounded-md transition-colors ${
    isSidebarMinimized ? "justify-center px-2" : "px-3"
  }`;
  const canViewProjects = hasPermission(session, "masterProjects", "view");
  const canViewIssues = hasPermission(session, "projectIssues", "view");
  const canViewWorkload = hasPermission(session, "workload", "view");
  const canViewMasterEmployees = hasPermission(session, "masterEmployees", "view");
  const canViewMasterRoles = hasPermission(session, "masterRoles", "view");
  const canViewMasterOrganizations = hasPermission(session, "masterOrganizations", "view");
  const canViewMasterUnits = hasPermission(session, "masterOrganizationUnits", "view");
  const canViewMasterPositions = hasPermission(session, "masterPositions", "view");
  const canViewAnyMaster =
    canViewMasterEmployees ||
    canViewMasterRoles ||
    canViewMasterOrganizations ||
    canViewMasterUnits ||
    canViewMasterPositions;

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

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [session.userId, session.accessToken]);

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
            <div className={`${isSidebarMinimized ? "w-7 h-7 text-sm" : "w-8 h-8 mr-3 text-base"} rounded bg-indigo-600 flex items-center justify-center text-white`}>
              Z
            </div>
            {!isSidebarMinimized && <span className="truncate">ZOHO PM SaaS</span>}
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

        <div className="sidebar-scroll flex-1 overflow-y-auto py-4 pr-1">
          <nav className="space-y-1 px-3">
            <Link to="/" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
              <Home className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "Beranda"}
            </Link>

            {!isSidebarMinimized && (
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Modul</p>
              </div>
            )}

            {isSidebarMinimized && <div className="pt-2" />}

            <Link to="/tugas-saya" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Tugas Saya">
              <ListTodo className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "Tugas Saya"}
            </Link>

            {canViewProjects && (
              <Link to="/proyek/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Proyek">
                <FolderKanban className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
                {!isSidebarMinimized && "Proyek"}
              </Link>
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
          <div className="flex items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tugas, isu, atau proyek..."
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-64 transition-all"
              />
            </div>
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
