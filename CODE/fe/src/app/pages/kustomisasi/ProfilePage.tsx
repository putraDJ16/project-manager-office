import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Activity, Briefcase, Building2, Calendar, Clock3, FolderKanban, KeyRound, Mail, Shield, User, Users } from "lucide-react";
import { changePassword, fetchMyProjects, getMe, type MyProjectResponse } from "../../services/authApi";
import { fetchUserAuditTrails, type ApiAuditTrail } from "../../services/auditTrailApi";

type ProfileState = {
  id: number;
  name: string;
  email: string;
  role: string | null;
  organization: string | null;
  unit_organization: string | null;
  position: string | null;
};

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [projects, setProjects] = useState<MyProjectResponse[]>([]);
  const [activities, setActivities] = useState<ApiAuditTrail[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
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
      setError(null);
      setActivityError(null);
      try {
        const profileData = await getMe();
        if (isCancelled) return;
        setProfile({
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role ?? null,
          organization: profileData.organization ?? null,
          unit_organization: profileData.unit_organization ?? null,
          position: profileData.position ?? null
        });

        const [projectResult, activityResult] = await Promise.allSettled([
          fetchMyProjects(),
          fetchUserAuditTrails(profileData.id, 25),
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
      } catch (loadError) {
        if (isCancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat profile.");
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false);
          setIsLoadingProjects(false);
          setIsLoadingActivities(false);
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
