
# Paket Markdown untuk Stitch — Sistem Manajemen Tugas (Task Management)

Paket ini disusun berdasarkan dokumen `Detail Task Design - Stitch.md` dan dipecah menjadi file yang lebih mudah dipakai bertahap di Stitch.

## Kenapa dipecah seperti ini?
Stitch mendukung pembuatan desain UI dari prompt natural language, bisa diiterasi lewat chat, dan hasilnya bisa diekspor ke Figma atau frontend code. Karena itu, pendekatan paling aman adalah **satu file = satu cluster desain** agar revisi lebih terkontrol.

## Urutan Eksekusi yang Disarankan
1. `01_GLOBAL_APP_SHELL_DAN_NAVIGASI.md`
2. `02_GLOBAL_DESIGN_SYSTEM.md`
3. `03_GLOBAL_HOME_DASHBOARD.md` (sangat disarankan)
4. `04_SHARED_PAGE_PATTERN.md`
5. File per modul mulai dari `05_...` sampai `11_...`

## Cara Pakai di Stitch
1. Mulai dari prompt di file global untuk membentuk shell aplikasi.
2. Setelah layout global stabil, pindah ke file modul yang ingin dibuat.
3. Di setiap file modul, jalankan prompt tahap 1 sampai 4 secara berurutan:
   - List Page
   - Detail Page
   - Create/Edit Form
   - Dashboard / Report Kontekstual
4. Setelah satu modul selesai, baru pindah ke modul berikutnya.

## Prinsip Umum
- Fokus ke **desktop web enterprise PM app** (Project Management SaaS).
- Gunakan **bahasa UI Indonesia**.
- Pertahankan pola konsisten: **Daftar → Detail → Form → Dashboard**.
- Semua layar wajib punya state: **loading, empty, error, success**.
- Relasi lintas modul sebaiknya masuk dalam **tab di halaman detail**, bukan menu terpisah.
- Fitur interaktif (drag-and-drop) harus punya panduan micro-interaction yang jelas.

## Konteks Sistem
Sistem ini adalah **platform manajemen tugas enterprise** dengan fitur:
- Manajemen tugas hierarkis (WBS, Milestone, Task List, Task, Subtask)
- Manajemen isu & bug tracking dengan SLA dan eskalasi
- Visualisasi proyek (Gantt Chart, Kanban, Classic View)
- Manajemen sumber daya (Workload Reports, Best Fit Allocation, What-if Simulation)
- Otomatisasi alur kerja (Blueprint Engine, Business Rules)
- Kustomisasi data (Custom Fields, Layout Builder, Conditional Rules)
- Waktu & finansial (Time Tracking, Budget Forecasting, EVM)

## Daftar File
- `01_GLOBAL_APP_SHELL_DAN_NAVIGASI.md`
- `02_GLOBAL_DESIGN_SYSTEM.md`
- `03_GLOBAL_HOME_DASHBOARD.md`
- `04_SHARED_PAGE_PATTERN.md`
- `05_MANAJEMEN_TUGAS.md`
- `06_MANAJEMEN_ISU_DAN_BUG.md`
- `07_VISUALISASI_DAN_NAVIGASI_PROYEK.md`
- `08_MANAJEMEN_SDM.md`
- `09_OTOMATISASI_ALUR_KERJA.md`
- `10_KUSTOMISASI_DATA_DAN_TATA_LETAK.md`
- `11_WAKTU_DAN_FINANSIAL.md`
