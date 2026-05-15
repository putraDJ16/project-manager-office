import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { Badge, Button, Card, Input, Select, SelectItem } from "@/components/ui";
import { type AuthSession } from "@/app/data/auth";
import { fetchRegisterOptions, loginWithApi, registerWithApi, type RegisterOptionsResponse } from "@/services/authApi";
import type { ThemeMode } from "@/utils/theme";
import appLogo from "../../../styles/LOGO-IGLO-v.3-with-indocyber-square.png";

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
    <div className="relative flex min-h-screen items-center justify-center p-6 ds-page-gradient">
      <Button
        type="button"
        variant="outline"
        color="secondary"
        onClick={onToggleTheme}
        className="absolute right-6 top-6 h-10 w-10 p-0 bg-color-card"
        aria-label={themeMode === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode"}
        title={themeMode === "dark" ? "Light mode" : "Dark mode"}
      >
        {themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Card className="grid w-full max-w-5xl overflow-hidden rounded-2xl md:grid-cols-2 ds-elevated-shadow">
        <div className="hidden md:flex flex-col justify-between bg-indigo-950 text-indigo-100 p-8">
          <div>
            <img src={appLogo} alt="IGLO Indocyber" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
            <h1 className="mt-6 text-2xl font-bold leading-tight">PM Dashboard</h1>
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
          <Badge color="success" variant="outline">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Secure Access
          </Badge>
          <h2 className="mt-4 text-2xl font-bold text-color-foreground">
            {mode === "login" ? "Masuk ke Akun" : "Daftar Mandiri"}
          </h2>
          <p className="mt-1 text-sm text-color-muted-foreground">
            {mode === "login"
              ? "Silakan login untuk melanjutkan ke dashboard aplikasi."
              : "Buat akun baru untuk mulai menggunakan aplikasi."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-lg border border-color-border bg-color-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`py-1.5 text-sm rounded-md font-medium ${
                mode === "login" ? "bg-color-card text-color-primary shadow-sm" : "text-color-muted-foreground"
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
                mode === "register" ? "bg-color-card text-color-primary shadow-sm" : "text-color-muted-foreground"
              }`}
            >
              Daftar
            </button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md border border-color-destructive/30 bg-color-destructive/10 px-3 py-2 text-sm text-color-destructive">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="nama@zoho.local"
                leadingIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Masukkan password"
                leadingIcon={<LockKeyhole className="w-4 h-4" />}
                required
              />

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-md border border-color-destructive/30 bg-color-destructive/10 px-3 py-2 text-sm text-color-destructive">
                  {error}
                </div>
              )}
              {registerOptionsError && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  {registerOptionsError}
                </div>
              )}

              <Input
                label="Nama Lengkap"
                type="text"
                value={registerForm.name}
                onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nama lengkap"
                leadingIcon={<UserRound className="w-4 h-4" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="nama@company.co.id"
                leadingIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Min. 8 karakter"
                  leadingIcon={<LockKeyhole className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Konfirmasi"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  placeholder="Ulangi password"
                  leadingIcon={<LockKeyhole className="w-4 h-4" />}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  label="Organisasi"
                  value={registerForm.organization}
                  onValueChange={(value) => setRegisterForm((current) => ({ ...current, organization: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.organizations.length === 0}
                  placeholder={isLoadingRegisterOptions ? "Memuat..." : "Pilih organisasi"}
                >
                  {registerOptions.organizations.map((option) => (
                    <SelectItem key={option.id} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Unit"
                  value={registerForm.unitOrganization}
                  onValueChange={(value) => setRegisterForm((current) => ({ ...current, unitOrganization: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.organization_units.length === 0}
                  placeholder={isLoadingRegisterOptions ? "Memuat..." : "Pilih unit organisasi"}
                >
                  {registerOptions.organization_units.map((option) => (
                    <SelectItem key={option.id} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Jabatan"
                  value={registerForm.position}
                  onValueChange={(value) => setRegisterForm((current) => ({ ...current, position: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.positions.length === 0}
                  placeholder={isLoadingRegisterOptions ? "Memuat..." : "Pilih jabatan"}
                >
                  {registerOptions.positions.map((option) => (
                    <SelectItem key={option.id} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoadingRegisterOptions} isLoading={isSubmitting}>
                {isSubmitting ? "Mendaftarkan..." : "Daftar dan Masuk"}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
