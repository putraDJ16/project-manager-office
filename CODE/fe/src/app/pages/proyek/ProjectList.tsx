import { useMemo, useState, type FormEvent } from "react";
import { Search, Plus, Filter, LayoutGrid, List, MoreVertical, FolderKanban, Activity, Calendar, X } from "lucide-react";
import { projects, teamMembers } from "../../data/mockData";

export function ProjectList() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      `${project.id} ${project.name} ${project.status}`.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };
  const hasSearchInput = searchInput.trim().length > 0;
  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Portfolio</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Semua Proyek</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portofolio Proyek</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${view === "grid" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Grid
            </button>
            <button 
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center ${view === "list" ? "bg-white shadow-sm text-indigo-700" : "text-slate-600 hover:text-slate-900"}`}
            >
              <List className="w-4 h-4 mr-2" /> List
            </button>
          </div>

          <div className="w-px h-6 bg-slate-300 mx-1"></div>

          <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Proyek Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari proyek..."
              className="pl-9 pr-10 py-1.5 w-64 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {hasSearchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700">
            Cari
          </button>
        </form>
        
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6 relative">
        {view === "grid" ? <GridView projects={filteredProjects} /> : <ListView projects={filteredProjects} />}
      </div>
    </div>
  );
}

function GridView({ projects }: { projects: typeof import("../../data/mockData").projects }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-56">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <h3 className="font-semibold text-slate-900 text-lg line-clamp-1 mb-1">{project.name}</h3>
        <p className="text-sm text-slate-500 flex items-center">
          <Activity className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
          {project.status === "Active" ? "Sedang Berjalan" : "Perencanaan"}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center text-sm">
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((u, i) => (
              <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white ring-1 ring-slate-100 ${u.color} z-${30 - i * 10}`}>
                {u.avatar}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            12 Hari
          </p>
        </div>
      </div>
    </div>
  );
}

function ListView({ projects }: { projects: typeof import("../../data/mockData").projects }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 font-medium">Nama Proyek</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium">Anggota Tim</th>
            <th className="px-6 py-4 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map(project => (
            <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-900">{project.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md border ${project.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                  {project.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex -space-x-2">
                  {teamMembers.slice(0, 3).map((u, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white ${u.color} z-${30 - i * 10}`}>
                      {u.avatar}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-indigo-600 font-medium">Lihat Detail</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
