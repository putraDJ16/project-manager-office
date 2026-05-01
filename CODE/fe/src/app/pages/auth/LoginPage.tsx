import { useEffect, useState, type FormEvent } from "react";
import { Building2, LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { type AuthSession } from "../../data/auth";
import type { ThemeMode } from "../../utils/theme";
import { fetchRegisterOptions, loginWithApi, registerWithApi, type RegisterOptionsResponse } from "../../services/authApi";

type LoginPageProps = {
  onLogin: (session: AuthSession) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
};

type LoginFormState = {
  email: string;
  password: string;
};

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization: string;
  unitOrganization: string;
  position: string;
};

export function LoginPage({ onLogin, themeMode, onToggleTheme }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    unitOrganization: "",
    position: ""
  });
  const [registerOptions, setRegisterOptions] = useState<RegisterOptionsResponse>({
    organizations: [],
    organization_units: [],
    positions: []
  });
  const [isLoadingRegisterOptions, setIsLoadingRegisterOptions] = useState(false);
  const [registerOptionsError, setRegisterOptionsError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "register") return;
    if (
      registerOptions.organizations.length > 0 &&
      registerOptions.organization_units.length > 0 &&
      registerOptions.positions.length > 0
    ) {
      return;
    }

    let isMounted = true;
    setIsLoadingRegisterOptions(true);
    setRegisterOptionsError("");

    fetchRegisterOptions()
      .then((options) => {
        if (!isMounted) return;
        setRegisterOptions(options);
        setRegisterForm((current) => ({
          ...current,
          organization: current.organization || options.organizations[0]?.name || "",
          unitOrganization: current.unitOrganization || options.organization_units[0]?.name || "",
          position: current.position || options.positions[0]?.name || ""
        }));
      })
      .catch((optionsError) => {
        if (!isMounted) return;
        const message = optionsError instanceof Error ? optionsError.message : "Gagal memuat data master.";
        setRegisterOptionsError(message);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRegisterOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, registerOptions.organizations.length, registerOptions.organization_units.length, registerOptions.positions.length]);

  const applyLoginResult = (result: Awaited<ReturnType<typeof loginWithApi>>) => {
    onLogin({
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      initials: result.user.initials,
      roleId: result.user.role_id,
      role: result.user.role,
      employeeId: result.user.employee_id,
      employeeName: result.user.employee_name,
      permissions: result.user.permissions,
      loggedInAt: new Date().toISOString(),
      accessToken: result.access_token,
      refreshToken: result.refresh_token
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();

    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await loginWithApi(email, password);
      applyLoginResult(result);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal login ke server.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      password: registerForm.password.trim(),
      confirm_password: registerForm.confirmPassword.trim(),
      organization: registerForm.organization.trim(),
      unit_organization: registerForm.unitOrganization.trim(),
      position: registerForm.position.trim()
    };

    if (!payload.name || !payload.email || !payload.password) {
      setError("Nama, email, dan password wajib diisi.");
      return;
    }
    if (!payload.organization || !payload.unit_organization || !payload.position) {
      setError("Organisasi, unit organisasi, dan jabatan wajib dipilih dari data master.");
      return;
    }
    if (payload.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (payload.password !== payload.confirm_password) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const result = await registerWithApi(payload);
      applyLoginResult(result);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal mendaftar ke server.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        aria-label={themeMode === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode"}
        title={themeMode === "dark" ? "Light mode" : "Dark mode"}
      >
        {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-indigo-950 text-indigo-100 p-8">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">Z</div>
            <h1 className="mt-6 text-2xl font-bold leading-tight">ZOHO PM SaaS</h1>
            <p className="mt-3 text-sm text-indigo-200">
              Platform manajemen proyek terpadu untuk tugas, isu, SDM, dan tata kelola master data.
            </p>
          </div>
          <div className="rounded-lg border border-indigo-800 bg-indigo-900/50 p-4 text-sm">
            <p className="font-semibold text-white mb-2">Demo Akun</p>
            <p className="text-indigo-200">admin@zoho.local / Admin123!</p>
            <p className="text-indigo-200 mt-1">pm@zoho.local / Pm123456!</p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Secure Access
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {mode === "login" ? "Masuk ke Akun" : "Daftar Mandiri"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login"
              ? "Silakan login untuk melanjutkan ke dashboard aplikasi."
              : "Buat akun baru untuk mulai menggunakan aplikasi."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`py-1.5 text-sm rounded-md font-medium ${
                mode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`py-1.5 text-sm rounded-md font-medium ${
                mode === "register" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Daftar
            </button>
          </div>

          {mode === "login" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="nama@zoho.local"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Masukkan password"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {registerOptionsError && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {registerOptionsError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nama lengkap"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="nama@company.co.id"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Min. 8 karakter"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Konfirmasi</label>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      placeholder="Ulangi password"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Organisasi</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={registerForm.organization}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, organization: event.target.value }))
                      }
                      disabled={isLoadingRegisterOptions || registerOptions.organizations.length === 0}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">{isLoadingRegisterOptions ? "Memuat..." : "Pilih organisasi"}</option>
                      {registerOptions.organizations.map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={registerForm.unitOrganization}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, unitOrganization: event.target.value }))
                    }
                    disabled={isLoadingRegisterOptions || registerOptions.organization_units.length === 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">{isLoadingRegisterOptions ? "Memuat..." : "Pilih unit organisasi"}</option>
                    {registerOptions.organization_units.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jabatan</label>
                  <select
                    value={registerForm.position}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, position: event.target.value }))}
                    disabled={isLoadingRegisterOptions || registerOptions.positions.length === 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">{isLoadingRegisterOptions ? "Memuat..." : "Pilih jabatan"}</option>
                    {registerOptions.positions.map((option) => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingRegisterOptions}
                className="w-full py-2.5 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Mendaftarkan..." : "Daftar dan Masuk"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
