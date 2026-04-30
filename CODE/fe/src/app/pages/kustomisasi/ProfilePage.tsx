import { useEffect, useMemo, useState, type ElementType, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Briefcase,
  Bug,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  FolderKanban,
  KeyRound,
  ListTodo,
  Mail,
  Shield,
  User,
  Users
} from "lucide-react";
import { teamMembers } from "../../data/mockData";
import { ISSUE_STATUS_ORDER, type Issue, type IssueStatus } from "../../domain/issues";
import { changePassword, fetchMyProjects, getMe, type MyProjectResponse } from "../../services/authApi";
import { fetchUserAuditTrails, type ApiAuditTrail } from "../../services/auditTrailApi";
import { getIssues, updateIssueStatus } from "../../services/issueService";
import { fetchAllTasks, updateTask, type ApiTask } from "../../services/taskApi";

type ProfileState = {
  id: number;
  name: string;
  email: string;
  employee_id: string | null;
  employee_name: string | null;
  role: string | null;
  organization: string | null;
  unit_organization: string | null;
  position: string | null;
};

type NoticeState = { type: "success" | "error"; message: string } | null;
type ProfileTab = "account" | "projects" | "assignments" | "activity";

const PROFILE_TABS: Array<{ id: ProfileTab; label: string; icon: ElementType }> = [
  { id: "account", label: "Akun", icon: User },
  { id: "projects", label: "Project", icon: FolderKanban },
  { id: "assignments", label: "Tugas Saya", icon: ListTodo },
  { id: "activity", label: "Riwayat", icon: Clock3 },
];

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [projects, setProjects] = useState<MyProjectResponse[]>([]);
  const [activities, setActivities] = useState<ApiAuditTrail[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<ApiTask[]>([]);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [profileTab, setProfileTab] = useState<ProfileTab>("account");
  const [assignmentTab, setAssignmentTab] = useState<"tasks" | "issues">("tasks");
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<NoticeState>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingIssueId, setSavingIssueId] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setIsLoadingProjects(true);
      setIsLoadingActivities(true);
      setIsLoadingAssignments(true);
      setError(null);
      setActivityError(null);
      setAssignmentError(null);
      try {
        const profileData = await getMe();
        if (isCancelled) return;
        const nextProfile = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          employee_id: profileData.employee_id ?? null,
          employee_name: profileData.employee_name ?? null,
          role: profileData.role ?? null,
          organization: profileData.organization ?? null,
          unit_organization: profileData.unit_organization ?? null,
          position: profileData.position ?? null
        };
        setProfile(nextProfile);

        const [projectResult, activityResult, taskResult, issueResult] = await Promise.allSettled([
          fetchMyProjects(),
          fetchUserAuditTrails(profileData.id, 25),
          fetchAllTasks(),
          getIssues(),
        ]);
        if (isCancelled) return;

        if (projectResult.status === "fulfilled") {
          setProjects(projectResult.value);
        } else {
          setError(projectResult.reason instanceof Error ? projectResult.reason.message : "Gagal memuat project.");
        }

        if (activityResult.status === "fulfilled") {
          setActivities(activityResult.value.filter((item) => item.method !== "GET"));
        } else {
          setActivityError(
            activityResult.reason instanceof Error ? activityResult.reason.message : "Gagal memuat riwayat aktivitas."
          );
        }

        if (taskResult.status === "fulfilled") {
          const tasksForUser = taskResult.value.filter((task) => isAssignedToProfile(task.assignee, nextProfile));
          setAssignedTasks(tasksForUser);
          setProgressDrafts(
            Object.fromEntries(tasksForUser.map((task) => [task.id, String(task.progress_percentage)]))
          );
        } else {
          setAssignmentError(taskResult.reason instanceof Error ? taskResult.reason.message : "Gagal memuat tugas saya.");
        }

        if (issueResult.status === "fulfilled") {
          setAssignedIssues(issueResult.value.filter((issue) => isAssignedToProfile(issue.assignee, nextProfile)));
        } else {
          setAssignmentError(issueResult.reason instanceof Error ? issueResult.reason.message : "Gagal memuat isu saya.");
        }
      } catch (loadError) {
        if (isCancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat profile.");
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false);
          setIsLoadingProjects(false);
          setIsLoadingActivities(false);
          setIsLoadingAssignments(false);
        }
      }
    };

    void loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const displayValue = (value: string | null | undefined) => (value && value.trim() ? value : "-");
  const statusColor = (status: string) => {
    if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Planning") return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "On Hold") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };
  const priorityColor = (priority: string | null) => {
    if (priority === "Critical") return "bg-red-50 text-red-700 border-red-200";
    if (priority === "High") return "bg-orange-50 text-orange-700 border-orange-200";
    if (priority === "Medium") return "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (priority === "Low") return "bg-green-50 text-green-700 border-green-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const projectSummary = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "Active").length,
    }),
    [projects]
  );

  const projectNameById = useMemo(
    () => projects.reduce<Record<string, string>>((acc, project) => ({ ...acc, [project.id]: project.name }), {}),
    [projects]
  );

  const assignmentSummary = useMemo(
    () => ({
      totalTasks: assignedTasks.length,
      openTasks: assignedTasks.filter((task) => task.progress_percentage < 100).length,
      totalIssues: assignedIssues.length,
      openIssues: assignedIssues.filter((issue) => issue.status !== "Resolved").length,
    }),
    [assignedIssues, assignedTasks]
  );

  useEffect(() => {
    if (!assignmentNotice) return;
    const timeout = window.setTimeout(() => setAssignmentNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [assignmentNotice]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError("Semua field password wajib diisi.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const message = await changePassword(passwordForm);
      setPasswordSuccess(message);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (submitError) {
      setPasswordError(submitError instanceof Error ? submitError.message : "Gagal mengubah password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSaveTaskProgress = async (task: ApiTask) => {
    const rawValue = progressDrafts[task.id] ?? String(task.progress_percentage);
    const progress = Number(rawValue);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setAssignmentNotice({ type: "error", message: "Progress tugas harus berupa angka 0-100." });
      return;
    }

    setSavingTaskId(task.id);
    try {
      const updated = await updateTask(task.id, { progress_percentage: progress });
      setAssignedTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      setProgressDrafts((current) => ({ ...current, [task.id]: String(updated.progress_percentage) }));
      setAssignmentNotice({ type: "success", message: `Progress ${task.id} berhasil diperbarui.` });
    } catch (updateError) {
      setAssignmentNotice({
        type: "error",
        message: updateError instanceof Error ? updateError.message : "Gagal memperbarui progress tugas.",
      });
    } finally {
      setSavingTaskId(null);
    }
  };

  const handleIssueStatusChange = async (issue: Issue, status: IssueStatus) => {
    if (issue.status === status) return;
    setSavingIssueId(issue.id);
    try {
      const updated = await updateIssueStatus(issue.id, status);
      setAssignedIssues((current) => current.map((item) => (item.id === issue.id ? updated : item)));
      setAssignmentNotice({ type: "success", message: `Status ${issue.id} berhasil diperbarui.` });
    } catch (updateError) {
      setAssignmentNotice({
        type: "error",
        message: updateError instanceof Error ? updateError.message : "Gagal memperbarui status isu.",
      });
    } finally {
      setSavingIssueId(null);
    }
  };

  return (
    <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-500 mb-1">
          <span>Akun</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-700">Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Saya</h1>
        <p className="text-sm text-slate-500 mt-1">
          Data diri, ubah password, informasi project, dan riwayat aktivitas akun Anda.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1">
        <div className="grid min-w-[640px] grid-cols-4 gap-1">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = profileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProfileTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {profileTab === "account" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Data Diri</h2>
          {isLoadingProfile && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Memuat data profile...
            </div>
          )}
          {!isLoadingProfile && !error && profile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileItem icon={<User className="w-4 h-4" />} label="Nama" value={displayValue(profile.name)} />
              <ProfileItem icon={<Mail className="w-4 h-4" />} label="Email" value={displayValue(profile.email)} />
              <ProfileItem icon={<Shield className="w-4 h-4" />} label="Role" value={displayValue(profile.role)} />
              <ProfileItem icon={<Building2 className="w-4 h-4" />} label="Organisasi" value={displayValue(profile.organization)} />
              <ProfileItem icon={<Building2 className="w-4 h-4" />} label="Unit Organisasi" value={displayValue(profile.unit_organization)} />
              <ProfileItem icon={<Briefcase className="w-4 h-4" />} label="Jabatan" value={displayValue(profile.position)} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Ubah Password</h2>
          <p className="text-sm text-slate-500 mb-4">Gunakan minimal 8 karakter untuk keamanan akun Anda.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <FormField
              label="Password Saat Ini"
              value={passwordForm.current_password}
              onChange={(value) => setPasswordForm((current) => ({ ...current, current_password: value }))}
            />
            <FormField
              label="Password Baru"
              value={passwordForm.new_password}
              onChange={(value) => setPasswordForm((current) => ({ ...current, new_password: value }))}
            />
            <FormField
              label="Konfirmasi Password Baru"
              value={passwordForm.confirm_password}
              onChange={(value) => setPasswordForm((current) => ({ ...current, confirm_password: value }))}
            />

            {passwordError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordSuccess}</div>
            )}

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmittingPassword ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>
          </div>
        )}

        {profileTab === "projects" && (
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Informasi Project Dimiliki</h2>
              <p className="text-sm text-slate-500 mt-1">Daftar project yang Anda kelola atau Anda ikuti sebagai anggota.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                <FolderKanban className="w-3.5 h-3.5" />
                Total {projectSummary.total}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                <Activity className="w-3.5 h-3.5" />
                Active {projectSummary.active}
              </span>
            </div>
          </div>

          {isLoadingProjects ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Memuat project...
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Belum ada project yang terhubung ke akun Anda.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Prioritas</th>
                    <th className="px-4 py-3 font-medium">Anggota</th>
                    <th className="px-4 py-3 font-medium">Tugas</th>
                    <th className="px-4 py-3 font-medium">Periode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((project) => (
                    <tr key={project.id} className="bg-white">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{project.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Manager: {displayValue(project.manager_name)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityColor(project.priority)}`}>
                          {displayValue(project.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {project.member_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{project.task_count}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(project.start_date)} - {formatDate(project.end_date)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {profileTab === "assignments" && (
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Tugas Saya</h2>
              <p className="text-sm text-slate-500 mt-1">
                Tugas dan isu/bug yang diassign ke akun Anda, termasuk progress yang perlu diperbarui.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700">
                <ListTodo className="w-3.5 h-3.5" />
                {assignmentSummary.openTasks}/{assignmentSummary.totalTasks} tugas aktif
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700">
                <Bug className="w-3.5 h-3.5" />
                {assignmentSummary.openIssues}/{assignmentSummary.totalIssues} isu aktif
              </span>
            </div>
          </div>

          <div className="mb-4 grid w-full grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 sm:w-96">
            <button
              type="button"
              onClick={() => setAssignmentTab("tasks")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                assignmentTab === "tasks" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Tugas
            </button>
            <button
              type="button"
              onClick={() => setAssignmentTab("issues")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                assignmentTab === "issues" ? "bg-slate-100 text-red-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bug className="w-4 h-4" />
              Isu & Bug
            </button>
          </div>

          {assignmentNotice && (
            <div
              className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                assignmentNotice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {assignmentNotice.message}
            </div>
          )}

          {assignmentError && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {assignmentError}
            </div>
          )}

          {isLoadingAssignments ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Memuat tugas saya...
            </div>
          ) : assignmentTab === "tasks" ? (
            assignedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Belum ada tugas yang diassign ke akun Anda.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Judul</th>
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Prioritas</th>
                      <th className="px-4 py-3 font-medium">Periode</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                      <th className="px-4 py-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedTasks.map((task) => (
                      <tr key={task.id} className="bg-white align-middle">
                        <td className="px-4 py-3 font-medium text-slate-500">{task.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Assignee: {resolveAssigneeDisplay(task.assignee)}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{projectNameById[task.project_id] ?? task.project_id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${priorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(task.start_date)} - {formatDate(task.end_date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-44 items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.min(100, Math.max(0, task.progress_percentage))}%` }}
                              />
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={progressDrafts[task.id] ?? String(task.progress_percentage)}
                              onChange={(event) =>
                                setProgressDrafts((current) => ({ ...current, [task.id]: event.target.value }))
                              }
                              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              aria-label={`Progress ${task.title}`}
                            />
                            <span className="text-xs text-slate-500">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleSaveTaskProgress(task)}
                            disabled={savingTaskId === task.id}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {savingTaskId === task.id ? "Menyimpan..." : "Simpan"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : assignedIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Belum ada isu atau bug yang diassign ke akun Anda.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">ID Bug</th>
                    <th className="px-4 py-3 font-medium">Judul Isu</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Diperbarui</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedIssues.map((issue) => (
                    <tr key={issue.id} className="bg-white align-middle">
                      <td className="px-4 py-3 font-bold text-slate-500">{issue.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{issue.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Module: {displayValue(issue.module)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{projectNameById[issue.projectId] ?? issue.projectId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${severityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={issue.status}
                          onChange={(event) => void handleIssueStatusChange(issue, event.target.value as IssueStatus)}
                          disabled={savingIssueId === issue.id}
                          className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${issueStatusColor(issue.status)}`}
                        >
                          {ISSUE_STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(issue.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {profileTab === "activity" && (
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Riwayat Aktivitas</h2>
              <p className="text-sm text-slate-500 mt-1">
                Tindakan yang Anda lakukan.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
              <Clock3 className="w-3.5 h-3.5" />
              {activities.length} aktivitas
            </span>
          </div>

          {activityError && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {activityError}
            </div>
          )}

          {isLoadingActivities ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Memuat riwayat aktivitas...
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Belum ada aktivitas yang tercatat.
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => {
                const activityLabel = resolveActivityLabel(activity);
                const activityDescription = resolveActivityDescription(activity);
                return (
                  <div key={activity.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{activityLabel}</p>
                      <div className="flex items-center gap-2">
                        <span className={statusBadgeClassName(activity.status_code)}>
                          {activity.status_code >= 400 ? "Gagal" : "Berhasil"}
                        </span>
                        <span className="text-xs text-slate-500">{formatDateTime(activity.created_at)}</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{activityDescription}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        )}
      </div>
    </div>
  );
}

function resolveActivityLabel(activity: ApiAuditTrail) {
  const method = activity.method.toUpperCase();
  const path = activity.path;

  if (method === "POST" && path === "/api/v1/projects") return "Membuat proyek";
  if (method === "POST" && path === "/api/v1/tasks") return "Membuat tugas";
  if (method === "POST" && /^\/api\/v1\/tasks\/[^/]+\/comments$/.test(path)) return "Menambahkan komentar tugas";
  if (method === "PATCH" && /^\/api\/v1\/tasks\/[^/]+$/.test(path)) return "Memperbarui tugas";

  const masterLabels: Record<string, string> = {
    "/api/v1/organizations": "organisasi",
    "/api/v1/organization-units": "unit organisasi",
    "/api/v1/positions": "jabatan",
    "/api/v1/roles": "role",
    "/api/v1/employees": "pegawai",
  };
  const masterEntry = Object.entries(masterLabels).find(([masterPath]) => path.startsWith(masterPath));
  if (masterEntry) {
    const [, entityLabel] = masterEntry;
    if (method === "POST") return `Menambah data master ${entityLabel}`;
    if (method === "PATCH" || method === "PUT") return `Mengubah data master ${entityLabel}`;
    if (method === "DELETE") return `Menghapus data master ${entityLabel}`;
  }

  const verbMap: Record<string, string> = {
    POST: "Membuat data",
    PATCH: "Memperbarui data",
    PUT: "Memperbarui data",
    DELETE: "Menghapus data",
    GET: "Melihat data",
  };
  return verbMap[method] ?? "Aktivitas sistem";
}

function resolveActivityDescription(activity: ApiAuditTrail) {
  const rawBody = activity.request_body;
  const body =
    rawBody && typeof rawBody === "object" && !Array.isArray(rawBody) ? (rawBody as Record<string, unknown>) : null;
  const highlightedValue = body?.name ?? body?.title ?? body?.content ?? body?.status ?? null;
  if (typeof highlightedValue === "string" && highlightedValue.trim()) {
    return `${activity.method} ${activity.path} - ${highlightedValue}`;
  }
  return `${activity.method} ${activity.path}`;
}

function statusBadgeClassName(statusCode: number) {
  if (statusCode >= 400) {
    return "inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700";
  }
  return "inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeAssignee(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function abbreviatedName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0]}.`;
}

function buildProfileAssigneeAliases(profile: ProfileState) {
  const rawAliases = [
    profile.id,
    profile.name,
    profile.email,
    profile.employee_id,
    profile.employee_name,
    abbreviatedName(profile.name),
    abbreviatedName(profile.employee_name),
  ];

  const aliases = new Set(rawAliases.map(normalizeAssignee).filter(Boolean));
  teamMembers.forEach((member) => {
    if (aliases.has(normalizeAssignee(member.name))) {
      aliases.add(normalizeAssignee(member.id));
    }
  });
  return aliases;
}

function isAssignedToProfile(assignee: string | null | undefined, profile: ProfileState) {
  const normalizedAssignee = normalizeAssignee(assignee);
  if (!normalizedAssignee) return false;
  return buildProfileAssigneeAliases(profile).has(normalizedAssignee);
}

function resolveAssigneeDisplay(assignee: string) {
  return teamMembers.find((member) => member.id === assignee)?.name ?? assignee;
}

function severityColor(severity: Issue["severity"]) {
  const styles: Record<Issue["severity"], string> = {
    Blocker: "bg-red-900 text-red-50 border-red-950",
    Critical: "bg-red-50 text-red-700 border-red-200",
    Major: "bg-orange-50 text-orange-700 border-orange-200",
    Minor: "bg-yellow-50 text-yellow-800 border-yellow-200",
    Trivial: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return styles[severity];
}

function issueStatusColor(status: Issue["status"]) {
  const styles: Record<Issue["status"], string> = {
    Open: "bg-slate-50 text-slate-700 border-slate-200",
    Investigating: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Escalated: "bg-red-50 text-red-700 border-red-200",
    Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return styles[status];
}

function ProfileItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 mt-1.5">{value}</p>
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}
