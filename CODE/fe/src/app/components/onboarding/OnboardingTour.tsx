import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  CalendarRange,
  Check,
  ClipboardList,
  Clock3,
  FolderKanban,
  Home,
  Layers3,
  Play,
  ShieldCheck,
  Users,
  X
} from "lucide-react";
import { Button } from "@/components/ui";
import appLogo from "../../../styles/LOGO-IGLO-v.3-with-indocyber-square.png";

type OnboardingStep = {
  label: string;
  title: string;
  description: string;
  howTo: string[];
  icon: typeof Home;
  visual: "dashboard" | "tasks" | "issues" | "projects" | "timesheet" | "master" | "calendar";
};

type OnboardingTourProps = {
  userName: string;
  initialScreen?: "welcome" | "tour";
  isCompleting?: boolean;
  error?: string | null;
  onComplete: () => void;
};

const steps: OnboardingStep[] = [
  {
    label: "Modul 1 dari 7",
    title: "Beranda Dashboard",
    description:
      "Pusat ringkasan harian untuk KPI proyek, grafik progres, kapasitas tim, prioritas kerja, dan activity feed.",
    howTo: [
      "Buka setelah login untuk melihat kondisi proyek terkini.",
      "Pantau kartu KPI dan burndown untuk progres.",
      "Klik item prioritas untuk langsung menuju detailnya."
    ],
    icon: Home,
    visual: "dashboard"
  },
  {
    label: "Modul 2 dari 7",
    title: "Tugas List, Kanban, dan WBS",
    description:
      "Kelola pekerjaan dalam beberapa tampilan, lengkap dengan detail tugas, komentar, checklist, dan timesheet.",
    howTo: [
      "Gunakan Tugas Saya untuk pekerjaan harian.",
      "Buka detail tugas untuk update progres dan checklist.",
      "Gunakan Buat Baru untuk menambah tugas atau timesheet."
    ],
    icon: ClipboardList,
    visual: "tasks"
  },
  {
    label: "Modul 3 dari 7",
    title: "Isu dan Bug",
    description:
      "Lacak isu proyek dengan severity, status, SLA, assignee, reproduksi masalah, dan log aktivitas.",
    howTo: [
      "Pantau indikator SLA agar penanganan tidak terlambat.",
      "Klik baris isu untuk melihat detail dan komentar.",
      "Laporkan isu baru dari menu Buat Baru."
    ],
    icon: Bug,
    visual: "issues"
  },
  {
    label: "Modul 4 dari 7",
    title: "Proyek",
    description:
      "Kelola proyek, fase, anggota, meeting, catatan rapat, dan lampiran dalam satu ruang kerja.",
    howTo: [
      "Buka detail proyek untuk melihat fase dan anggota.",
      "Gunakan Monitoring untuk memantau lintas proyek.",
      "Catat hasil meeting di panel Meeting Notes."
    ],
    icon: FolderKanban,
    visual: "projects"
  },
  {
    label: "Modul 5 dari 7",
    title: "Pengisian Timesheet",
    description:
      "Catat waktu kerja harian per proyek atau tugas sebagai dasar pelaporan effort dan beban kerja tim.",
    howTo: [
      "Buka Tugas Saya lalu tab Timesheet.",
      "Pilih proyek atau tugas, tanggal, dan durasi jam.",
      "Isi rutin setiap hari agar laporan effort akurat."
    ],
    icon: Clock3,
    visual: "timesheet"
  },
  {
    label: "Modul 6 dari 7",
    title: "Master Data",
    description:
      "Sumber data pegawai, role, permission, organisasi, unit organisasi, dan jabatan.",
    howTo: [
      "Kelola data pegawai, status, divisi, dan jabatan.",
      "Atur role untuk kontrol akses tiap modul.",
      "Tambah data melalui modal di halaman master."
    ],
    icon: Users,
    visual: "master"
  },
  {
    label: "Modul 7 dari 7",
    title: "Kalender Proyek",
    description:
      "Lihat jadwal meeting, milestone, dan tenggat kerja proyek agar rencana mingguan lebih mudah dibaca.",
    howTo: [
      "Buka menu Kalender dari sidebar.",
      "Pantau meeting dan agenda yang akan datang.",
      "Klik agenda untuk menuju detail terkait."
    ],
    icon: CalendarRange,
    visual: "calendar"
  }
];

const checklistItems = [
  "Lengkapi profil Anda",
  "Buka proyek pertama",
  "Cek tugas aktif di Tugas Saya",
  "Catat timesheet pertama",
  "Atur preferensi notifikasi email"
];

function MiniWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
        <span className="h-2 w-2 rounded-full bg-rose-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="ml-2">{title}</span>
      </div>
      {children}
    </div>
  );
}

function StepVisual({ type }: { type: OnboardingStep["visual"] }) {
  if (type === "dashboard") {
    return (
      <MiniWindow title="Beranda">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Proyek Aktif", "12"],
            ["Tugas Selesai", "84"],
            ["Isu Terbuka", "7"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
              <p className="text-[10px] text-[var(--ink-3)]">{label}</p>
              <p className="text-lg font-bold text-[var(--accent)]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
          <p className="mb-2 text-[10px] text-[var(--ink-3)]">Burndown</p>
          <div className="flex h-24 items-end gap-1">
            {[70, 58, 52, 43, 36, 28, 18, 10].map((height) => (
              <span key={height} className="flex-1 rounded-t bg-[var(--accent)]" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </MiniWindow>
    );
  }

  if (type === "tasks") {
    return (
      <MiniWindow title="Tugas Kanban">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["To Do", "text-[var(--ink-3)]", 2],
            ["In Progress", "text-[var(--accent)]", 2],
            ["Done", "text-[var(--green)]", 1]
          ].map(([title, color, count]) => (
            <div key={title as string}>
              <p className={`mb-1 text-[10px] font-semibold ${color}`}>{title}</p>
              {Array.from({ length: count as number }).map((_, index) => (
                <div key={index} className="mb-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] p-2 shadow-sm">
                  <div className="h-1.5 w-2/3 rounded bg-[var(--border-strong)]" />
                  <div className="mt-1 h-1.5 w-1/2 rounded bg-[var(--border)]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </MiniWindow>
    );
  }

  if (type === "issues") {
    return (
      <MiniWindow title="Isu dan Bug">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="grid grid-cols-3 bg-[var(--bg)] px-3 py-2 text-[10px] font-semibold text-[var(--ink-3)]">
            <span>Isu</span>
            <span>Severity</span>
            <span>SLA</span>
          </div>
          {[
            ["Login error", "Tinggi", "bg-rose-100 text-rose-700"],
            ["Load lambat", "Sedang", "bg-amber-100 text-amber-700"],
            ["Typo label", "Rendah", "bg-emerald-100 text-emerald-700"]
          ].map(([issue, severity, color]) => (
            <div key={issue} className="grid grid-cols-3 items-center border-t border-[var(--border)] px-3 py-2 text-[11px]">
              <span className="text-[var(--ink-2)]">{issue}</span>
              <span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${color}`}>{severity}</span>
              </span>
              <span className="text-[var(--ink-3)]">2h</span>
            </div>
          ))}
        </div>
      </MiniWindow>
    );
  }

  if (type === "projects") {
    return (
      <MiniWindow title="Proyek Grid">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Portal NDE", "70%", "bg-emerald-500"],
            ["AMS Revamp", "40%", "bg-amber-500"],
            ["Dashboard SDM", "55%", "bg-indigo-500"],
            ["Migrasi DB", "90%", "bg-emerald-500"]
          ].map(([name, progress, dot]) => (
            <div key={name} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">{name}</p>
                <span className={`h-2 w-2 rounded-full ${dot}`} />
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: progress }} />
              </div>
              <div className="mt-2 flex -space-x-1">
                <span className="h-4 w-4 rounded-full border border-white bg-indigo-200" />
                <span className="h-4 w-4 rounded-full border border-white bg-emerald-200" />
                <span className="h-4 w-4 rounded-full border border-white bg-amber-200" />
              </div>
            </div>
          ))}
        </div>
      </MiniWindow>
    );
  }

  if (type === "timesheet") {
    return (
      <MiniWindow title="Tugas Saya Timesheet">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_2fr_0.7fr] bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-400">
            <span>Hari</span>
            <span>Tugas</span>
            <span className="text-right">Jam</span>
          </div>
          {[
            ["Senin", "Perbaikan login", "3.5"],
            ["Selasa", "Review PR", "2.0"],
            ["Rabu", "Meeting proyek", "4.0"],
            ["Kamis", "Integrasi API", "5.5"]
          ].map(([day, task, hours]) => (
            <div key={day} className="grid grid-cols-[1fr_2fr_0.7fr] border-t border-slate-100 px-3 py-2 text-[11px]">
              <span className="text-slate-500">{day}</span>
              <span className="truncate text-slate-700">{task}</span>
              <span className="text-right font-semibold text-indigo-700">{hours}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-dashed border-indigo-300 py-2 text-center text-[11px] text-indigo-600">
          + Catat entri timesheet
        </div>
      </MiniWindow>
    );
  }

  if (type === "master") {
    return (
      <MiniWindow title="Master Pegawai">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-4 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-400">
            <span>NIP</span>
            <span>Nama</span>
            <span>Divisi</span>
            <span>Status</span>
          </div>
          {[
            ["1021", "Andi", "Dev"],
            ["1044", "Budi", "QA"],
            ["1078", "Citra", "PM"]
          ].map(([nip, name, unit]) => (
            <div key={nip} className="grid grid-cols-4 border-t border-slate-100 px-3 py-2 text-[11px]">
              <span className="text-slate-400">{nip}</span>
              <span className="text-slate-700">{name}</span>
              <span className="text-slate-500">{unit}</span>
              <span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">Aktif</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Role", "Organisasi", "Unit", "Jabatan"].map((item) => (
            <span key={item} className="rounded bg-indigo-50 px-2 py-1 text-[10px] text-indigo-600">
              {item}
            </span>
          ))}
        </div>
      </MiniWindow>
    );
  }

  return (
    <MiniWindow title="Kalender Proyek">
      <div className="rounded-lg border border-slate-200 bg-white p-2">
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400">
          {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }).map((_, index) => {
            const day = index + 1;
            const hasMeeting = [8, 15, 23].includes(day);
            const hasTask = [3, 12, 19, 27].includes(day);
            return (
              <div
                key={day}
                className={`flex aspect-square flex-col rounded border border-slate-100 bg-white p-1 ${
                  day === 15 ? "bg-indigo-50 ring-1 ring-indigo-400" : ""
                }`}
              >
                <span className="text-[9px] text-slate-400">{day}</span>
                <div className="mt-auto flex gap-0.5">
                  {hasTask && <span className="h-1 flex-1 rounded bg-indigo-500" />}
                  {hasMeeting && <span className="h-1 flex-1 rounded bg-amber-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MiniWindow>
  );
}

export function OnboardingTour({
  userName,
  initialScreen = "welcome",
  isCompleting = false,
  error,
  onComplete
}: OnboardingTourProps) {
  const [screen, setScreen] = useState<"welcome" | "tour" | "finish">(initialScreen);
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const step = steps[currentStep];
  const Icon = step.icon;
  const firstName = useMemo(() => userName.trim().split(/\s+/)[0] || "User", [userName]);

  const startTour = () => {
    setCurrentStep(0);
    setScreen("tour");
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((value) => value + 1);
      return;
    }
    setScreen("finish");
  };

  const prevStep = () => {
    setCurrentStep((value) => Math.max(0, value - 1));
  };

  const toggleChecklist = (item: string) => {
    setCheckedItems((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        {screen === "welcome" && (
          <div className="grid md:grid-cols-2">
            <div className="flex min-h-[520px] flex-col justify-between bg-indigo-950 p-8 text-indigo-100 md:p-10">
              <div>
                <div className="flex items-center gap-3">
                  <img src={appLogo} alt="IGLO Indocyber" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
                  <div>
                    <p className="font-bold leading-tight text-white">PM Dashboard</p>
                    <p className="text-xs text-indigo-300">IGLO Indocyber</p>
                  </div>
                </div>
                <h1 className="mt-12 text-3xl font-bold leading-snug text-white">Selamat datang, {firstName}</h1>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-200">
                  Satu tempat untuk mengelola proyek, tugas, isu, jadwal, dan beban kerja tim Anda.
                  Kami akan memandu Anda mengenal fitur utama dalam beberapa langkah singkat.
                </p>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["1", "Kenali 7 modul inti"],
                  ["2", "Pahami alur kerja harian"],
                  ["3", "Mulai dari checklist Anda"]
                ].map(([number, text]) => (
                  <div key={number} className="flex items-center gap-3 text-indigo-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-800 text-xs">{number}</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center bg-white p-8 md:p-10">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Clock3 className="h-3.5 w-3.5" />
                Sekitar 2 menit
              </span>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">Tur cepat fitur aplikasi</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Tur ini menjelaskan apa fungsi tiap modul dan bagaimana Anda menggunakannya sehari-hari.
              </p>
              {error && <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="mt-8 flex flex-col gap-3">
                <Button type="button" size="lg" onClick={startTour} disabled={isCompleting}>
                  <Play className="h-4 w-4" />
                  Mulai Tur
                </Button>
                <Button type="button" variant="outline" color="secondary" size="lg" onClick={onComplete} isLoading={isCompleting}>
                  Lewati untuk sekarang
                </Button>
              </div>
            </div>
          </div>
        )}

        {screen === "tour" && (
          <div>
            <div className="flex items-center justify-between px-6 pt-6 md:px-8">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <img src={appLogo} alt="IGLO Indocyber" className="h-8 w-8 rounded-md bg-white object-contain" />
                <span>Tur Fitur</span>
              </div>
              <button
                type="button"
                onClick={onComplete}
                disabled={isCompleting}
                className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
              >
                Lewati
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-6 pt-5 md:px-8">
              {steps.map((item, index) => (
                <span
                  key={item.title}
                  className={`h-2 rounded-full transition-all ${index === currentStep ? "w-7 bg-indigo-600" : "w-2 bg-slate-300"}`}
                />
              ))}
            </div>

            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-8">
                <div className="h-[360px] overflow-hidden rounded-xl">
                  <StepVisual type={step.visual} />
                </div>
              </div>
              <div className="flex flex-col p-6 pt-0 md:p-8 md:pl-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{step.label}</p>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <Icon className="h-6 w-6 text-indigo-600" />
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.description}</p>
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Cara pakai</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {step.howTo.map((item) => (
                      <li key={item} className="flex gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {error && <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <div className="mt-auto flex items-center justify-between pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    color="secondary"
                    onClick={prevStep}
                    disabled={currentStep === 0 || isCompleting}
                    className={currentStep === 0 ? "invisible" : ""}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  <Button type="button" onClick={nextStep} disabled={isCompleting}>
                    {currentStep === steps.length - 1 ? "Selesai" : "Lanjut"}
                    {currentStep === steps.length - 1 ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {screen === "finish" && (
          <div className="p-8 text-center md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Anda siap memulai</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Selesaikan langkah pertama berikut agar pekerjaan awal lebih terarah.
            </p>

            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {checklistItems.map((item, index) => {
                const isChecked = checkedItems.includes(item);
                return (
                  <label
                    key={item}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklist(item)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className={`text-sm ${isChecked ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {index + 1}. {item}
                    </span>
                  </label>
                );
              })}
            </div>
            {error && <p className="mx-auto mt-5 max-w-md rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button type="button" variant="outline" color="secondary" onClick={startTour} disabled={isCompleting}>
                <Layers3 className="h-4 w-4" />
                Ulangi Tur
              </Button>
              <Button type="button" onClick={onComplete} isLoading={isCompleting}>
                <ShieldCheck className="h-4 w-4" />
                Masuk ke Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
