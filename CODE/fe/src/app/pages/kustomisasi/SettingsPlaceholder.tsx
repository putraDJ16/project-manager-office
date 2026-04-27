import { Settings, Wrench } from "lucide-react";

export function SettingsPlaceholder() {
  return (
    <div className="h-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col justify-center items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
        <Settings className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Pengaturan Umum</h1>
      <p className="text-slate-600 mt-2 max-w-xl">
        Halaman pengaturan global masih dalam tahap pengembangan. Untuk saat ini, konfigurasi
        <span className="font-semibold"> SLA & Eskalasi </span>
        dapat diakses langsung dari modul Isu & Bug.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
        <Wrench className="w-4 h-4" />
        Status: Placeholder aktif, route sudah valid.
      </div>
    </div>
  );
}
