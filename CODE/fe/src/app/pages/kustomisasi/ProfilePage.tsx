import { useEffect, useState, type ReactNode } from "react";
import { Briefcase, Building2, Mail, Shield, User } from "lucide-react";
import { getMe } from "../../services/authApi";

type ProfileState = {
  name: string;
  email: string;
  role: string | null;
  organization: string | null;
  unit_organization: string | null;
  position: string | null;
};

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMe();
        if (isCancelled) return;
        setProfile({
          name: data.name,
          email: data.email,
          role: data.role ?? null,
          organization: data.organization ?? null,
          unit_organization: data.unit_organization ?? null,
          position: data.position ?? null
        });
      } catch (loadError) {
        if (isCancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat profile.");
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const displayValue = (value: string | null | undefined) => (value && value.trim() ? value : "-");

  return (
    <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-slate-500 mb-1">
          <span>Akun</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-700">Profile</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Informasi profile pengguna berdasarkan data organisasi.</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Memuat data profile...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!isLoading && !error && profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileItem icon={<User className="w-4 h-4" />} label="Nama" value={displayValue(profile.name)} />
          <ProfileItem icon={<Mail className="w-4 h-4" />} label="Email" value={displayValue(profile.email)} />
          <ProfileItem icon={<Shield className="w-4 h-4" />} label="Role" value={displayValue(profile.role)} />
          <ProfileItem icon={<Building2 className="w-4 h-4" />} label="Organisasi" value={displayValue(profile.organization)} />
          <ProfileItem icon={<Building2 className="w-4 h-4" />} label="Unit Organisasi" value={displayValue(profile.unit_organization)} />
          <ProfileItem icon={<Briefcase className="w-4 h-4" />} label="Jabatan" value={displayValue(profile.position)} />
        </div>
      )}
    </div>
  );
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
