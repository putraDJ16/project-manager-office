import { useState, type FormEvent } from "react";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { type AuthSession } from "../../data/auth";
import { loginWithApi } from "../../services/authApi";

type LoginPageProps = {
  onLogin: (session: AuthSession) => void;
};

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      onLogin({
        userId: result.user.id,
        name: result.user.name,
        email: result.user.email,
        initials: result.user.initials,
        loggedInAt: new Date().toISOString(),
        accessToken: result.access_token,
        refreshToken: result.refresh_token
      });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Gagal login ke server.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-100 flex items-center justify-center p-6">
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
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Masuk ke Akun</h2>
          <p className="mt-1 text-sm text-slate-500">Silakan login untuk melanjutkan ke dashboard aplikasi.</p>

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
        </div>
      </div>
    </div>
  );
}
