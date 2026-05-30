import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckSquare,
  Database,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Users
} from "lucide-react";
import { type AuthSession } from "@/app/data/auth";
import {
  fetchRegisterOptions,
  loginWithApi,
  registerWithApi,
  requestForgotPasswordOtp,
  requestRegisterOtp,
  resetForgotPassword,
  type RegisterOptionsResponse
} from "@/services/authApi";
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
  otp: string;
};

type ForgotPasswordFormState = {
  email: string;
  newPassword: string;
  confirmPassword: string;
  otp: string;
};

const features = [
  {
    icon: CheckSquare,
    title: "Kelola Tugas & Isu",
    description: "Lacak progres, prioritas, dan deadline tim secara real-time."
  },
  {
    icon: Users,
    title: "Manajemen SDM",
    description: "Alokasi resource dan beban kerja tim yang transparan."
  },
  {
    icon: Database,
    title: "Master Data Terpusat",
    description: "Satu sumber kebenaran untuk seluruh data tata kelola."
  }
];

export function LoginPage({ onLogin, themeMode, onToggleTheme }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [forgotForm, setForgotForm] = useState<ForgotPasswordFormState>({
    email: "",
    newPassword: "",
    confirmPassword: "",
    otp: ""
  });
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    unitOrganization: "",
    position: "",
    otp: ""
  });
  const [registerOptions, setRegisterOptions] = useState<RegisterOptionsResponse>({
    organizations: [],
    organization_units: [],
    positions: []
  });
  const [isLoadingRegisterOptions, setIsLoadingRegisterOptions] = useState(false);
  const [registerOptionsError, setRegisterOptionsError] = useState("");
  const [registerOtpSentFor, setRegisterOtpSentFor] = useState("");
  const [forgotOtpSentFor, setForgotOtpSentFor] = useState("");
  const [canUseForgotPassword, setCanUseForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegisterOtpStep = Boolean(registerOtpSentFor) && registerOtpSentFor === registerForm.email.trim().toLowerCase();
  const isForgotOtpStep = Boolean(forgotOtpSentFor) && forgotOtpSentFor === forgotForm.email.trim().toLowerCase();

  const isDark = themeMode === "dark";
  const pageClass = isDark
    ? "bg-[#0d1017] text-[#eef1f7]"
    : "bg-[#f4f6fa] text-[#16203a]";
  const cardClass = isDark
    ? "border-[#222a3a] bg-[#151a26] shadow-[0_1px_2px_rgba(0,0,0,.3),0_24px_48px_-16px_rgba(0,0,0,.6)]"
    : "border-[#e4e8f0] bg-white shadow-[0_1px_2px_rgba(16,32,58,.04),0_12px_32px_-12px_rgba(16,32,58,.12)]";
  const panelClass = isDark
    ? "border-[#222a3a] bg-[#11151f]"
    : "border-[#e4e8f0] bg-[#fbfcfe]";
  const textMutedClass = isDark ? "text-[#a4adc2]" : "text-[#475068]";
  const faintTextClass = isDark ? "text-[#6f7890]" : "text-[#7b8499]";
  const inputClass = isDark
    ? "border-[#2d3648] bg-[#1a2030] text-[#eef1f7] placeholder:text-[#737c94] focus:border-[#f2374f] focus:ring-[#f2374f]/20"
    : "border-[#d3d9e6] bg-white text-[#16203a] placeholder:text-[#9aa2b5] focus:border-[#e11d34] focus:ring-[#e11d34]/15";
  const tabShellClass = isDark ? "border border-[#222a3a] bg-[#10141f]" : "bg-[#eef1f6]";
  const activeTabClass = isDark
    ? "bg-[#222a3a] text-[#ff8090] shadow-[0_1px_2px_rgba(0,0,0,.3)]"
    : "bg-white text-[#e11d34] shadow-[0_1px_2px_rgba(16,32,58,.1)]";

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
      onboardingCompleted: result.user.onboarding_completed,
      permissions: result.user.permissions,
      loggedInAt: new Date().toISOString(),
      accessToken: result.access_token,
      refreshToken: result.refresh_token
    });
  };

  const resetFeedback = () => {
    setError("");
    setNotice("");
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
    resetFeedback();
    setCanUseForgotPassword(false);
    try {
      const result = await loginWithApi(email, password);
      applyLoginResult(result);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal login ke server.";
      setError(message);
      setCanUseForgotPassword(true);
      setForgotForm((current) => ({ ...current, email }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = forgotForm.email.trim().toLowerCase();
    const newPassword = forgotForm.newPassword.trim();
    const confirmPassword = forgotForm.confirmPassword.trim();

    if (!email) {
      setError("Email wajib diisi.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Password baru dan konfirmasi wajib diisi.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    resetFeedback();
    try {
      if (forgotOtpSentFor !== email) {
        const message = await requestForgotPasswordOtp(email);
        setForgotOtpSentFor(email);
        setForgotForm((current) => ({ ...current, otp: "" }));
        setNotice(message);
        return;
      }

      const message = await resetForgotPassword({
        email,
        new_password: newPassword,
        confirm_password: confirmPassword,
        otp: forgotForm.otp.trim()
      });
      setNotice(message);
      setForm({ email, password: "" });
      setForgotForm({ email: "", newPassword: "", confirmPassword: "", otp: "" });
      setForgotOtpSentFor("");
      setCanUseForgotPassword(false);
      setMode("login");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal reset password.";
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
    resetFeedback();
    try {
      if (registerOtpSentFor !== payload.email) {
        const message = await requestRegisterOtp(payload);
        setRegisterOtpSentFor(payload.email);
        setRegisterForm((current) => ({ ...current, otp: "" }));
        setNotice(message);
        return;
      }

      const result = await registerWithApi({ ...payload, otp: registerForm.otp.trim() });
      applyLoginResult(result);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal mendaftar ke server.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: "login" | "register" | "forgot") => {
    setMode(nextMode);
    resetFeedback();
    setCanUseForgotPassword(false);
  };

  return (
    <div className={`flex min-h-screen items-center justify-center p-6 md:p-8 ${pageClass}`}>
      <div className={`grid w-full max-w-[1040px] overflow-hidden rounded-2xl border md:grid-cols-[1.05fr_1fr] ${cardClass}`}>
        <section className={`hidden min-h-[620px] flex-col border-r px-11 py-10 md:flex ${panelClass}`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-[46px] w-[46px] items-center justify-center rounded-[10px] border ${
                isDark ? "border-[#222a3a] bg-white" : "border-[#e4e8f0] bg-white"
              }`}
            >
              <img src={appLogo} alt="IGLO Indocyber" className="h-8 w-8 rounded-md object-contain" />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-[.4px] ${faintTextClass}`}>
              Indocyber Global Teknologi
            </span>
          </div>

          <div className="mt-9">
            <h1 className="text-[27px] font-extrabold leading-tight tracking-[-.4px]">PM Dashboard</h1>
            <p className={`mt-2.5 max-w-[94%] text-[14.5px] leading-relaxed ${textMutedClass}`}>
              Platform manajemen proyek terpadu untuk tugas, isu, SDM, dan tata kelola master data.
            </p>
          </div>

          <div className="mt-[34px] flex flex-col gap-1.5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`flex items-start gap-3.5 rounded-[10px] p-3.5 transition-colors ${
                    isDark ? "hover:bg-[#151a26]" : "hover:bg-white hover:shadow-[0_1px_3px_rgba(16,32,58,.06)]"
                  }`}
                >
                  <div className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] ${isDark ? "bg-[#f2374f]/15" : "bg-[#fdeaec]"}`}>
                    <Icon className={isDark ? "h-[19px] w-[19px] text-[#f2374f]" : "h-[19px] w-[19px] text-[#e11d34]"} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{feature.title}</h3>
                    <p className={`mt-0.5 text-[12.5px] leading-snug ${textMutedClass}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`mt-auto border-t pt-6 ${isDark ? "border-[#222a3a]" : "border-[#e4e8f0]"}`}>
            <p className={`text-[12px] leading-relaxed ${textMutedClass}`}>
              Platform manajemen proyek yang dirancang untuk meningkatkan produktivitas dan kolaborasi tim Anda.
            </p>
          </div>
        </section>

        <section className="flex flex-col p-7 sm:p-10 md:px-12 md:py-11">
          <div className="mb-[30px] flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 rounded-md px-[11px] py-1.5 text-xs font-semibold ${
                isDark
                  ? "bg-emerald-300/10 text-emerald-300"
                  : "bg-[#e7f6ef] text-[#0a8a5f]"
              }`}
            >
              <ShieldCheck className="h-[13px] w-[13px]" />
              Secure Access
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border transition-colors ${
                isDark
                  ? "border-[#222a3a] bg-[#1a2030] text-[#6f7890] hover:border-[#2d3648] hover:text-[#a4adc2]"
                  : "border-[#e4e8f0] bg-white text-[#7b8499] hover:border-[#d3d9e6] hover:text-[#475068]"
              }`}
              aria-label={isDark ? "Aktifkan light mode" : "Aktifkan dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <h2 className="text-[25px] font-extrabold leading-tight tracking-[-.3px]">
            {mode === "login" ? "Masuk ke Akun" : mode === "register" ? "Daftar Mandiri" : "Reset Password"}
          </h2>
          <p className={`mt-1.5 text-sm ${textMutedClass}`}>
            {mode === "login"
              ? "Silakan login untuk melanjutkan ke dashboard aplikasi."
              : mode === "register"
                ? "Buat akun baru untuk mulai menggunakan aplikasi."
                : "Masukkan password baru dan verifikasi OTP dari email Anda."}
          </p>

          <div className={`mt-[26px] grid grid-cols-2 rounded-[9px] p-1 ${tabShellClass}`}>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-md px-3 py-[9px] text-sm font-semibold transition-colors ${
                mode === "login" || mode === "forgot" ? activeTabClass : textMutedClass
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-md px-3 py-[9px] text-sm font-semibold transition-colors ${
                mode === "register" ? activeTabClass : textMutedClass
              }`}
            >
              Daftar
            </button>
          </div>

          {mode === "login" && (
            <form onSubmit={handleSubmit} className="mt-[26px] space-y-[18px]">
              <Feedback error={error} notice={notice} />
              <AuthField
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                placeholder="nama@indocyber.id"
                icon={<Mail className="h-[18px] w-[18px]" />}
                inputClass={inputClass}
              />
              <AuthField
                label="Password"
                type="password"
                value={form.password}
                onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                placeholder="Masukkan password"
                icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                inputClass={inputClass}
              />

              <div className="flex items-center justify-between gap-3">
                <label className={`flex cursor-pointer items-center gap-2 text-[13.5px] ${textMutedClass}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-[15px] w-[15px] accent-[#e11d34]"
                  />
                  Ingat saya
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotForm((current) => ({ ...current, email: form.email.trim().toLowerCase() }));
                    switchMode("forgot");
                  }}
                  className={`text-[13px] font-semibold ${isDark ? "text-[#ff8090]" : "text-[#e11d34]"} hover:underline`}
                >
                  Lupa password?
                </button>
              </div>

              <PrimaryAuthButton isDark={isDark} isLoading={isSubmitting}>Masuk</PrimaryAuthButton>

              {canUseForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotForm((current) => ({ ...current, email: form.email.trim().toLowerCase() }));
                    switchMode("forgot");
                  }}
                  className={`w-full rounded-[11px] border px-4 py-3 text-sm font-semibold transition-colors ${
                    isDark
                      ? "border-[#2d3648] bg-[#1a2030] text-[#eef1f7] hover:bg-[#222a3a]"
                      : "border-[#d3d9e6] bg-white text-[#16203a] hover:bg-[#f7f9fc]"
                  }`}
                >
                  Reset via OTP
                </button>
              )}
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPasswordSubmit} className="mt-[26px] space-y-[18px]">
              <Feedback error={error} notice={notice} />
              <AuthField
                label="Email"
                type="email"
                value={forgotForm.email}
                onChange={(value) => {
                  setForgotForm((current) => ({ ...current, email: value, otp: "" }));
                  setForgotOtpSentFor("");
                }}
                placeholder="nama@indocyber.id"
                icon={<Mail className="h-[18px] w-[18px]" />}
                inputClass={inputClass}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <AuthField
                  label="Password Baru"
                  type="password"
                  value={forgotForm.newPassword}
                  onChange={(value) => {
                    setForgotForm((current) => ({ ...current, newPassword: value, otp: "" }));
                    setForgotOtpSentFor("");
                  }}
                  placeholder="Min. 8 karakter"
                  icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
                <AuthField
                  label="Konfirmasi"
                  type="password"
                  value={forgotForm.confirmPassword}
                  onChange={(value) => {
                    setForgotForm((current) => ({ ...current, confirmPassword: value, otp: "" }));
                    setForgotOtpSentFor("");
                  }}
                  placeholder="Ulangi password"
                  icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
              </div>
              {isForgotOtpStep && (
                <AuthField
                  label="Kode OTP"
                  type="text"
                  value={forgotForm.otp}
                  onChange={(value) => setForgotForm((current) => ({ ...current, otp: value }))}
                  placeholder="6 digit dari email"
                  icon={<ShieldCheck className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
              )}
              <PrimaryAuthButton isDark={isDark} isLoading={isSubmitting}>
                {isForgotOtpStep ? "Verifikasi OTP dan Reset" : "Kirim OTP Reset"}
              </PrimaryAuthButton>
              <SecondaryAuthButton isDark={isDark} onClick={() => switchMode("login")}>
                Kembali ke Login
              </SecondaryAuthButton>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="mt-[26px] space-y-[18px]">
              <Feedback error={error} notice={notice} />
              {registerOptionsError && (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {registerOptionsError}
                </div>
              )}
              <AuthField
                label="Nama Lengkap"
                type="text"
                value={registerForm.name}
                onChange={(value) => setRegisterForm((current) => ({ ...current, name: value }))}
                placeholder="Nama lengkap"
                icon={<UserRound className="h-[18px] w-[18px]" />}
                inputClass={inputClass}
              />
              <AuthField
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(value) => {
                  setRegisterForm((current) => ({ ...current, email: value, otp: "" }));
                  setRegisterOtpSentFor("");
                }}
                placeholder="nama@company.co.id"
                icon={<Mail className="h-[18px] w-[18px]" />}
                inputClass={inputClass}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <AuthField
                  label="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
                  placeholder="Min. 8 karakter"
                  icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
                <AuthField
                  label="Konfirmasi"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, confirmPassword: value }))}
                  placeholder="Ulangi password"
                  icon={<LockKeyhole className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <AuthSelect
                  label="Organisasi"
                  value={registerForm.organization}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, organization: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.organizations.length === 0}
                  inputClass={inputClass}
                  options={registerOptions.organizations.map((option) => option.name)}
                />
                <AuthSelect
                  label="Unit"
                  value={registerForm.unitOrganization}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, unitOrganization: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.organization_units.length === 0}
                  inputClass={inputClass}
                  options={registerOptions.organization_units.map((option) => option.name)}
                />
                <AuthSelect
                  label="Jabatan"
                  value={registerForm.position}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, position: value }))}
                  disabled={isLoadingRegisterOptions || registerOptions.positions.length === 0}
                  inputClass={inputClass}
                  options={registerOptions.positions.map((option) => option.name)}
                />
              </div>
              {isRegisterOtpStep && (
                <AuthField
                  label="Kode OTP"
                  type="text"
                  value={registerForm.otp}
                  onChange={(value) => setRegisterForm((current) => ({ ...current, otp: value }))}
                  placeholder="6 digit dari email"
                  icon={<ShieldCheck className="h-[18px] w-[18px]" />}
                  inputClass={inputClass}
                />
              )}
              <PrimaryAuthButton isDark={isDark} disabled={isLoadingRegisterOptions} isLoading={isSubmitting}>
                {isRegisterOtpStep ? "Verifikasi OTP dan Masuk" : "Kirim OTP Pendaftaran"}
              </PrimaryAuthButton>
            </form>
          )}
          <p className={`mt-7 text-center text-xs ${faintTextClass}`}>
            © 2026 PT Indocyber Global Teknologi. Semua hak dilindungi.
          </p>
        </section>
      </div>
    </div>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  inputClass
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  inputClass: string;
}) {
  return (
    <label className="block">
      <span className="mb-[7px] block text-[13px] font-semibold">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-current opacity-50">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className={`w-full rounded-[9px] border py-3 pl-10 pr-[13px] text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
        />
      </span>
    </label>
  );
}

function AuthSelect({
  label,
  value,
  onChange,
  disabled,
  options,
  inputClass
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options: string[];
  inputClass: string;
}) {
  return (
    <label className="block">
      <span className="mb-[7px] block text-[13px] font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
        className={`w-full rounded-[9px] border px-[13px] py-3 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
      >
        {options.length === 0 && <option value="">Memuat...</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PrimaryAuthButton({
  children,
  isDark,
  isLoading,
  disabled = false
}: {
  children: ReactNode;
  isDark: boolean;
  isLoading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-[9px] px-4 py-[13px] text-[14.5px] font-bold text-white transition disabled:pointer-events-none disabled:opacity-60 ${
        isDark ? "bg-[#f2374f] hover:bg-[#ff4a60]" : "bg-[#e11d34] hover:bg-[#c4162c]"
      }`}
    >
      {isLoading && <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
      {isLoading ? "Memproses..." : children}
    </button>
  );
}

function SecondaryAuthButton({ children, isDark, onClick }: { children: ReactNode; isDark: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[11px] border px-4 py-3 text-sm font-semibold transition-colors ${
        isDark ? "border-[#2d3648] bg-[#1a2030] text-[#eef1f7] hover:bg-[#222a3a]" : "border-[#d3d9e6] bg-white text-[#16203a] hover:bg-[#f7f9fc]"
      }`}
    >
      {children}
    </button>
  );
}

function Feedback({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {notice && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}

