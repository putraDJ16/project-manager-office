import { useState } from "react";
import { Outlet, Link } from "react-router";
import { 
  Bell, 
  Search, 
  Home, 
  CheckSquare, 
  Bug, 
  FolderKanban, 
  User,
  Users, 
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut
} from "lucide-react";
import type { AuthSession } from "../../data/auth";

type AppShellProps = {
  session: AuthSession;
  onLogout: () => void;
};

export function AppShell({ session, onLogout }: AppShellProps) {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(true);
  const navItemClass = `flex items-center py-2 text-sm font-medium rounded-md transition-colors ${
    isSidebarMinimized ? "justify-center px-2" : "px-3"
  }`;

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
            <Link to="/" className={`${navItemClass} bg-indigo-900 text-white`}>
              <Home className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "Beranda"}
            </Link>
            
            {!isSidebarMinimized && (
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Modul</p>
              </div>
            )}
            
            <Link to="/tugas/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
              <CheckSquare className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "Manajemen Tugas"}
            </Link>
            
            <Link to="/isu/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
              <Bug className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "Isu & Bug"}
            </Link>
            
            <Link to="/sdm/workload" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`}>
              <Users className={`w-5 h-5 opacity-75 ${isSidebarMinimized ? "" : "mr-3"}`} />
              {!isSidebarMinimized && "SDM & Kapabilitas"}
            </Link>

            {isSidebarMinimized ? (
              <>
                <Link to="/master/pegawai" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Pegawai">
                  <User className="w-5 h-5 opacity-75" />
                </Link>
                <Link to="/proyek/list" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Proyek">
                  <FolderKanban className="w-5 h-5 opacity-75" />
                </Link>
                <Link to="/master/role" className={`${navItemClass} hover:bg-indigo-900 hover:text-white`} title="Master - Role">
                  <Shield className="w-5 h-5 opacity-75" />
                </Link>
              </>
            ) : (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setIsMasterMenuOpen((current) => !current)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-indigo-900 hover:text-white transition-colors"
                >
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-3 opacity-75" />
                    Master
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMasterMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isMasterMenuOpen && (
                  <div className="mt-1 pl-11 pr-2">
                    <Link
                      to="/master/pegawai"
                      className="flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2 opacity-80" />
                      Pegawai
                    </Link>
                    <Link
                      to="/proyek/list"
                      className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                    >
                      <FolderKanban className="w-4 h-4 mr-2 opacity-80" />
                      Proyek
                    </Link>
                    <Link
                      to="/master/role"
                      className="mt-1 flex items-center px-3 py-1.5 text-sm rounded-md text-indigo-200 hover:text-white hover:bg-indigo-900 transition-colors"
                    >
                      <Shield className="w-4 h-4 mr-2 opacity-80" />
                      Role
                    </Link>
                  </div>
                )}
              </div>
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
          {/* Breadcrumb Context Area */}
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

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
