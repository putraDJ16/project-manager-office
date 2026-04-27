# Perencanaan Prototype MVP: PM SaaS (Project ZOHO)

Berdasarkan analisis dari codebase `KAMSIBER/CODE`, proyek tersebut dibangun dengan arsitektur **React SPA** yang sangat modern. Komposisi teknologi utamanya meliputi:
- **Vite** + **React 18** (TypeScript).
- **React Router 7** untuk routing aplikasi berbasis file/konfigurasi.
- **Tailwind CSS v4** dengan CSS variables untuk design system (`theme.css`).
- **Radix UI** + **Shadcn UI** untuk koleksi komponen lengkap (Dialog, Table, Dropdown, Accordion, dll).
- **Framer Motion**, **React DnD** (untuk Drag and Drop), dan **Recharts** untuk visualisasi data/Gantt/Chart.

Kita akan menggunakan persis **tech-stack dan arsitektur yang sama** ini untuk mengimplementasikan *prototype* UI berdasarkan `stitch_task_md_pack`. Mengingat ini adalah aplikasi Manajemen Tugas (SaaS Project Management), penggunaan library visualisasi drag-and-drop sangat pas untuk komponen Kanban dan Gantt.

---

## Tahapan Eksekusi (Phased Execution)

Karena paket instruksi desain terbagi menjadi 12 file, kita membagi rancangan eksekusi *prototype* ini ke dalam fase terstruktur untuk memastikan fondasi layout (App Shell) kokoh sebelum bergeser ke detail komponen dan halaman.

### Fase 1: Setup Proyek & Skema Global (App Shell & Navigation)
*Target: Aplikasi bisa dijalankan, layout sidebar responsif, topbar widget aktif, theme working.*
1. Inisialisasi Vite + React + TypeScript + Tailwind v4.
2. Konfigurasi `components.json` (shadcn) dan instalasi komponen dasar UI (Button, Input, DropdownMenu, Avatar, Badge, dsb).
3. Implementasi **`theme.css`** dan **`tailwind.css`** (Design System) dengan estetika terang/produktif (SaaS style: Warna Indigo/Putih, bukan Dark mode Cybersecurity).
4. Pembuatan **`AppShell`**: Left Sidebar Navbar dengan state navigasi, Topbar dengan mock Timer Widget, dan Main Content Area grid.
5. Setup `routes.ts` dasar sebagai root rute layout.

### Fase 2: Pembangkitan Halaman Inti (Global Dashboard)
*Target: Home Dashboard dan Komponen visualisasi Data.*
1. Membuat halaman **`HomeDashboard`**.
2. Menyusun template KPI cards.
3. Menggunakan library *Recharts* untuk mock data grafik: Sprint Burn-down dan Workload Bar Chart.
4. Membuat Grid Table "My Priorities" pada dashboard.
5. Menyiapkan `app/data/mockData.ts` secara global yang berisikan contoh data Profil Avatar (karyawan), ID Tugas, dan Nama Proyek untuk di-sinkronisasikan ke relasi tabel lainnya.

### Fase 3: Modul Pertama — Manajemen Tugas (WBS & Agile)
*Target: List View WBS, Kanban Board, Task Panel (Slide-out Drawer).*
1. Setup Routing moduler: `/tugas/list`, `/tugas/board` dsb.
2. Pembuatan Tabel bersarang (Nested WBS Table) yang bisa melakukan indentasi visual (TreeView).
3. Pembuatan komponen Agile Kanban Board dengan library drag-and-drop (misal: dnd-kit atau react-dnd) agar kartu tugas dapat dipindah antar kolom.
4. Pembuatan Drawer `TaskDetailPanel` (menggunakan side-drawer/sheet shadcn). Ini merupakan mock form inline-editing dan subtask list.

### Fase 4: Modul Kedua — Manajemen Isu & Bug (SLA & Eskalasi)
*Target: Bug Board, Form Report Modal, dan Tabel Konfigurasi SLA.*
1. Routing spesifik: `/isu/list`, `/isu/sla-settings`
2. Konfigurasi visual UI Badge `Severity` dengan hierarki warna kontras (Blocker, Critical, Major, Minor, Trivial).
3. Penempatan SLA Timer Indicator berupa peringatan urgensi merah/kuning dalam daftar tabel Bug.
4. Pembuatan Modal besar "Report Bug" gaya 2-kolom dengan integrasi area *Drag & drop upload file error screenshot*.

### Fase 5: Modul Lanjutan (SDM, Workflow, Layout Tracker, Time & Budget)
*Target: Pelengkapan seluruh requirement desain prototype sesuai pack markdown sisa.*
1. **SDM**: Mengimplementasikan visualisasi Heatmap Workload, Toggle Switch Global Simulation ("What-if" Mode), dan popover pintar "Best Fit Allocation".
2. **Workflow**: Layar UI flow canvas berbasis elemen DOM untuk Blueprint Status Builder, Modals Transition Warning, dan List-based Editor untuk Business Rules.
3. **Kustomisasi**: Kanvas visual Drag and drop Section layout, UI form builder dinamis dengan Conditional Layout Rules animation.
4. **Time & Budget**: Sinkronisasi Global Widget Timer ke task spesifik, Tabel log manual time grid (Timesheet Weekly), Input budget layout per resources, dan implementasi UI EVM Executive Dashboard C-Level (Grafik/dometer Speed Index dan Cost Index).

---

## Pertanyaan Konfigurasi & Persiapan (Klarifikasi Pengguna)

Sebelum memulai eksekusi skrip Bash instalasi di proyek mana pun, wajib mengkonfirmasi:

1. **Lokasi Direktori Base Baru**: Di mana folder letak workspace frontend baru ini akan dilahirkan? (Misalnya `C:\Users\putra\Documents\Project ZOHO\CODE`).
2. **Penggunaan TypeScript**: Apakah base proyek harus 100% TSX (TypeScript React) mengikuti format standard UI shadcn yang persis seperti template *KAMSIBER/CODE*?
3. **Librari Drag-and-drop**: Pilih `react-dnd` (legacy) atau `@dnd-kit/core` (modern & lebih mudah untuk interaksi kanban) atau `@hello-pangea/dnd`? Disarankan mengadopsi standar yang sudah biasa digunakan oleh user.
