import { useEffect, useState } from "react";
import { getEmailPreferences, updateEmailPreferences, type EmailPreferences } from "../../services/emailPreferencesApi";

const OPTIONS: Array<{ key: keyof EmailPreferences; label: string; description: string }> = [
  { key: "project_assignment", label: "Project assignment", description: "Manager dan anggota project baru." },
  { key: "task_assignment", label: "Task assignment", description: "Tugas baru yang ditugaskan ke Anda." },
  { key: "issue_events", label: "Issue events", description: "Isu baru, escalation, dan update penting." },
  { key: "meeting_invites", label: "Meeting invites", description: "Undangan, perubahan jadwal, dan pembatalan rapat." },
  { key: "meeting_reminders", label: "Meeting reminders", description: "Pengingat rapat H-1 dan sebelum mulai." },
  { key: "action_items", label: "Action items", description: "Action item hasil meeting yang ditugaskan." }
];

export function EmailPreferencesPage() {
  const [prefs, setPrefs] = useState<EmailPreferences | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getEmailPreferences().then(setPrefs).catch((error) => setMessage(error instanceof Error ? error.message : "Gagal memuat preferensi."));
  }, []);

  const toggle = async (key: keyof EmailPreferences) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      setPrefs(await updateEmailPreferences({ [key]: next[key] }));
      setMessage("Preferensi email tersimpan.");
    } catch (error) {
      setPrefs(prefs);
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan preferensi.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Pengaturan</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Notifikasi Email</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Atur kanal email per kategori. Email akun dan keamanan tetap aktif untuk melindungi akun Anda.</p>
      </div>
      {message ? <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">{message}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => (
          <button key={option.key} type="button" onClick={() => toggle(option.key)} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span>
              <span className="block font-semibold text-slate-950">{option.label}</span>
              <span className="mt-1 block text-sm text-slate-500">{option.description}</span>
            </span>
            <span className={`h-7 w-12 rounded-full p-1 transition ${prefs?.[option.key] ? "bg-emerald-500" : "bg-slate-300"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white transition ${prefs?.[option.key] ? "translate-x-5" : ""}`} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
