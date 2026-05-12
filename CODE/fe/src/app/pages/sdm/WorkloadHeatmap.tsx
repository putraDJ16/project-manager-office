import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  FolderKanban,
  Search,
  ShieldAlert,
  UserCheck,
  X
} from "lucide-react";
import type { Employee } from "../../data/masterData";
import { fetchEmployees } from "../../services/masterApi";
import { fetchProjects, getProject, type ApiProjectDetail } from "../../services/projectApi";
import { getIssues } from "../../services/issueService";
import { ISSUE_STATUS_ORDER, type Issue, type IssueSeverity } from "../../domain/issues";

type EmployeeWorkload = {
  employee: Employee;
  projects: ApiProjectDetail[];
  managedProjects: ApiProjectDetail[];
  assignedIssues: Issue[];
  reportedIssues: Issue[];
};

type StatTone = "blue" | "emerald" | "amber" | "rose";
type ProjectCountFilter = "all" | "none" | "one" | "multiple";

const SEVERE_ISSUES = new Set<IssueSeverity>(["Blocker", "Critical"]);

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "SD";
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isOpenIssue(issue: Issue) {
  return issue.status !== "Resolved";
}

function statusBadgeClass(status: Issue["status"]) {
  const styles: Record<Issue["status"], string> = {
    Open: "bg-slate-100 text-slate-700",
    Investigating: "bg-blue-100 text-blue-700",
    "In Progress": "bg-amber-100 text-amber-700",
    Escalated: "bg-red-100 text-red-700",
    Resolved: "bg-emerald-100 text-emerald-700"
  };
  return styles[status];
}

function severityBadgeClass(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-red-900 text-red-50",
    Critical: "bg-red-600 text-white",
    Major: "bg-orange-100 text-orange-700",
    Minor: "bg-yellow-100 text-yellow-800",
    Trivial: "bg-slate-100 text-slate-600"
  };
  return styles[severity];
}

function workloadTone(item: EmployeeWorkload) {
  const openIssues = item.assignedIssues.filter(isOpenIssue).length;
  const severeIssues = item.assignedIssues.filter((issue) => isOpenIssue(issue) && SEVERE_ISSUES.has(issue.severity)).length;
  if (severeIssues > 0 || item.projects.length >= 4) return "Tinggi";
  if (openIssues >= 3 || item.projects.length >= 2) return "Perlu Pantau";
  return "Stabil";
}

export function WorkloadHeatmap() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ApiProjectDetail[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [projectCountFilter, setProjectCountFilter] = useState<ProjectCountFilter>("all");
  const [issueFilter, setIssueFilter] = useState<"all" | "with_issue" | "severe">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [employeeRows, projectRows, issueRows] = await Promise.all([
          fetchEmployees(),
          fetchProjects(),
          getIssues()
        ]);
        const projectDetails = await Promise.all(projectRows.map((project) => getProject(project.id)));
        if (isCancelled) return;
        setEmployees(employeeRows);
        setProjects(projectDetails);
        setIssues(issueRows);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data SDM.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active"),
    [employees]
  );

  const organizationOptions = useMemo(() => {
    return Array.from(new Set(activeEmployees.map((employee) => employee.organization).filter(Boolean))).sort();
  }, [activeEmployees]);

  const positionOptions = useMemo(() => {
    return Array.from(new Set(activeEmployees.map((employee) => employee.position).filter(Boolean))).sort();
  }, [activeEmployees]);

  const workloads = useMemo<EmployeeWorkload[]>(() => {
    return activeEmployees.map((employee) => {
      const employeeName = normalize(employee.name);
      const employeeId = normalize(employee.id);
      const employeeEmail = normalize(employee.email);

      const memberProjects = projects.filter((project) => {
        const isManager = normalize(project.manager_id) === employeeId || normalize(project.manager_name) === employeeName;
        const isMember = project.members.some(
          (member) => normalize(member.employee_id) === employeeId || normalize(member.employee_name) === employeeName
        );
        return isManager || isMember;
      });

      const managedProjects = memberProjects.filter(
        (project) => normalize(project.manager_id) === employeeId || normalize(project.manager_name) === employeeName
      );

      const assignedIssues = issues.filter((issue) => normalize(issue.assignee) === employeeName);
      const reportedIssues = issues.filter(
        (issue) => normalize(issue.reporter) === employeeName || normalize(issue.reporter) === employeeEmail
      );

      return {
        employee,
        projects: memberProjects,
        managedProjects,
        assignedIssues,
        reportedIssues
      };
    });
  }, [activeEmployees, issues, projects]);

  const filteredWorkloads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workloads
      .filter((item) => {
        if (organizationFilter !== "all" && item.employee.organization !== organizationFilter) return false;
        if (positionFilter !== "all" && item.employee.position !== positionFilter) return false;
        if (projectCountFilter === "none" && item.projects.length !== 0) return false;
        if (projectCountFilter === "one" && item.projects.length !== 1) return false;
        if (projectCountFilter === "multiple" && item.projects.length < 2) return false;
        if (issueFilter === "with_issue" && item.assignedIssues.filter(isOpenIssue).length === 0) return false;
        if (
          issueFilter === "severe" &&
          !item.assignedIssues.some((issue) => isOpenIssue(issue) && SEVERE_ISSUES.has(issue.severity))
        ) {
          return false;
        }
        if (!query) return true;
        const source = `${item.employee.name} ${item.employee.position} ${item.employee.organization} ${item.projects
          .map((project) => project.name)
          .join(" ")} ${item.assignedIssues.map((issue) => issue.title).join(" ")}`.toLowerCase();
        return source.includes(query);
      })
      .sort((left, right) => {
        const leftSevere = left.assignedIssues.filter((issue) => isOpenIssue(issue) && SEVERE_ISSUES.has(issue.severity)).length;
        const rightSevere = right.assignedIssues.filter((issue) => isOpenIssue(issue) && SEVERE_ISSUES.has(issue.severity)).length;
        if (rightSevere !== leftSevere) return rightSevere - leftSevere;
        if (right.projects.length !== left.projects.length) return right.projects.length - left.projects.length;
        return left.employee.name.localeCompare(right.employee.name, "id");
      });
  }, [issueFilter, organizationFilter, positionFilter, projectCountFilter, searchQuery, workloads]);

  const activeProjectCount = projects.filter((project) => project.status !== "Completed").length;
  const peopleWithOpenIssues = workloads.filter((item) => item.assignedIssues.some(isOpenIssue)).length;
  const severeOpenIssues = issues.filter((issue) => isOpenIssue(issue) && SEVERE_ISSUES.has(issue.severity)).length;
  const unassignedOpenIssues = issues.filter((issue) => isOpenIssue(issue) && !issue.assignee).length;
  const topIssueOwners = [...workloads]
    .filter((item) => item.assignedIssues.some(isOpenIssue))
    .sort((left, right) => right.assignedIssues.filter(isOpenIssue).length - left.assignedIssues.filter(isOpenIssue).length)
    .slice(0, 6);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>SDM & Kapabilitas</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Keterlibatan Project</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Beban SDM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau jumlah project per SDM dan isu yang sedang melekat ke masing-masing orang.
          </p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari SDM, jabatan, project, atau isu..."
              className="pl-9 pr-9 py-1.5 w-80 border border-slate-300 rounded-md text-sm bg-white"
            />
            {searchInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md">
            Cari
          </button>
        </form>

        <select
          value={organizationFilter}
          onChange={(event) => setOrganizationFilter(event.target.value)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Organisasi: Semua</option>
          {organizationOptions.map((organization) => (
            <option key={organization} value={organization}>
              {organization}
            </option>
          ))}
        </select>

        <select
          value={positionFilter}
          onChange={(event) => setPositionFilter(event.target.value)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Jabatan: Semua</option>
          {positionOptions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>

        <select
          value={projectCountFilter}
          onChange={(event) => setProjectCountFilter(event.target.value as ProjectCountFilter)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Project: Semua</option>
          <option value="none">Belum punya project</option>
          <option value="one">1 project</option>
          <option value="multiple">2+ project</option>
        </select>

        <select
          value={issueFilter}
          onChange={(event) => setIssueFilter(event.target.value as typeof issueFilter)}
          className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white"
        >
          <option value="all">Isu: Semua SDM</option>
          <option value="with_issue">Punya isu aktif</option>
          <option value="severe">Blocker/Critical</option>
        </select>

        <div className="ml-auto text-xs font-medium text-slate-500">{filteredWorkloads.length} SDM tampil</div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/60 p-6">
        {isLoading && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Memuat data SDM, project, dan isu...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!isLoading && !error && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <StatCard label="SDM Aktif" value={activeEmployees.length} icon={UserCheck} tone="blue" />
              <StatCard label="Project Aktif" value={activeProjectCount} icon={FolderKanban} tone="emerald" />
              <StatCard label="SDM Dengan Isu" value={peopleWithOpenIssues} icon={ShieldAlert} tone="amber" />
              <StatCard label="Critical/Blocker" value={severeOpenIssues} icon={AlertTriangle} tone="rose" />
            </div>

            <div className="grid grid-cols-12 gap-5">
              <section className="col-span-12 xl:col-span-8">
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">SDM</th>
                        <th className="px-4 py-3 text-left font-medium">Project</th>
                        <th className="px-4 py-3 text-left font-medium">Isu Terkait</th>
                        <th className="px-4 py-3 text-left font-medium">Status Beban</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWorkloads.map((item) => {
                        const openIssues = item.assignedIssues.filter(isOpenIssue);
                        const severeIssues = openIssues.filter((issue) => SEVERE_ISSUES.has(issue.severity));
                        const tone = workloadTone(item);

                        return (
                          <tr key={item.employee.id} className="hover:bg-slate-50 align-top">
                            <td className="px-4 py-4 w-[30%]">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                  {getInitials(item.employee.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">{item.employee.name}</p>
                                  <p className="text-xs text-slate-500">{item.employee.position}</p>
                                  <p className="text-xs text-slate-400 truncate">{item.employee.organization}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 w-[27%]">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                                  {item.projects.length} project
                                </span>
                                {item.managedProjects.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                                    {item.managedProjects.length} manager
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.projects.slice(0, 3).map((project) => (
                                  <span key={project.id} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                                    {project.name}
                                  </span>
                                ))}
                                {item.projects.length > 3 && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs">
                                    +{item.projects.length - 3}
                                  </span>
                                )}
                                {item.projects.length === 0 && <span className="text-xs text-slate-400">Belum terhubung project</span>}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-slate-700">{openIssues.length} aktif</span>
                                {severeIssues.length > 0 && (
                                  <span className="text-xs font-semibold text-red-700">{severeIssues.length} high risk</span>
                                )}
                                {item.reportedIssues.length > 0 && (
                                  <span className="text-xs text-slate-500">{item.reportedIssues.length} dilaporkan</span>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                {openIssues.slice(0, 2).map((issue) => (
                                  <div key={issue.id} className="flex items-center gap-2 min-w-0">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${severityBadgeClass(issue.severity)}`}>
                                      {issue.severity}
                                    </span>
                                    <span className="text-xs text-slate-600 truncate">{issue.title}</span>
                                  </div>
                                ))}
                                {openIssues.length === 0 && (
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Tidak ada issue aktif sebagai assignee
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 w-36">
                              <span
                                className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${
                                  tone === "Tinggi"
                                    ? "bg-red-100 text-red-700"
                                    : tone === "Perlu Pantau"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {tone}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredWorkloads.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                            Tidak ada SDM yang cocok dengan filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="col-span-12 xl:col-span-4 space-y-5">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800">SDM Dengan Isu Terbanyak</h2>
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="space-y-3">
                    {topIssueOwners.map((item) => {
                      const openIssues = item.assignedIssues.filter(isOpenIssue);
                      return (
                        <div key={item.employee.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.employee.name}</p>
                            <p className="text-xs text-slate-500 truncate">{item.projects.length} project aktif/terkait</p>
                          </div>
                          <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold">
                            {openIssues.length} isu
                          </span>
                        </div>
                      );
                    })}
                    {topIssueOwners.length === 0 && (
                      <p className="text-sm text-slate-500">Belum ada isu aktif yang punya assignee SDM.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800">Isu Aktif Belum Diassign</h2>
                    <BriefcaseBusiness className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{unassignedOpenIssues}</p>
                  <p className="text-xs text-slate-500 mt-1">Perlu dipetakan ke assignee agar ownership jelas.</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-slate-800 mb-3">Distribusi Status Isu</h2>
                  <div className="space-y-2">
                    {ISSUE_STATUS_ORDER.map((status) => {
                      const count = issues.filter((issue) => issue.status === status).length;
                      return (
                        <div key={status} className="flex items-center justify-between gap-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${statusBadgeClass(status)}`}>
                            {status}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: StatTone;
}) {
  const styles: Record<StatTone, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
