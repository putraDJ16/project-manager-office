
# Global App Shell dan Navigasi

## Tujuan
File ini dipakai paling awal untuk membentuk fondasi layout aplikasi sebelum membuat masing-masing modul. Pastikan shell ini selesai dan direvisi dulu sebelum lanjut ke file berikutnya.

## Sasaran Desain
- desktop-first enterprise SaaS web app (project management)
- tampilan modern, bersih, dan produktif
- cocok untuk tim software development, creative agency, atau operasi enterprise
- sidebar intuitif, topbar kaya fitur, content area fleksibel, fokus pada alur kerja tugas

## Struktur Navigasi

### Sidebar Level 1
- Beranda (Home / Overview)
- Tugas
- Isu & Bug
- Proyek
- SDM & Sumber Daya
- Otomatisasi
- Pengaturan

### Sidebar Level 2

**Tugas**
- Semua Tugas
- Task Lists
- WBS
- Milestone
- Sprint
- Tugas Berulang

**Isu & Bug**
- Semua Isu
- SLA & Eskalasi
- Bug Board

**Proyek**
- Daftar Proyek
- Gantt Chart
- Kanban Board
- Classic View / Table

**SDM & Sumber Daya**
- Workload Report
- Simulasi Beban Kerja
- Alokasi Terbaik (Best Fit)

**Otomatisasi**
- Blueprint & Workflow
- Business Rules
- Automated Actions

**Pengaturan**
- Custom Fields
- Layout Builder
- Aturan Kondisional (Layout Rules)
- Pengguna & Peran
- Integrasi (Webhook, Email)
- Anggaran & Billing

## Elemen Shell yang Wajib Ada
- left sidebar dengan warna indigo/violet gelap, 2 level navigasi, collapsible
- top bar berisi:
  - global search bar
  - tombol **+ Tambah Cepat** (Universal Add — FAB style)
  - Global Timer widget (stopwatch kecil aktif/nonaktif)
  - notification bell dengan badge counter
  - profile menu
- breadcrumb di bawah top bar
- page title area dengan deskripsi singkat
- content canvas lebar dan fleksibel
- panel kanan opsional untuk upcoming deadlines, timer aktif, atau quick insights
- desain nyaman untuk tabel high-density, chart, kanban, tabs, dan forms

## State Global
- sidebar collapse / expand
- active menu dan submenu state
- loading skeleton state
- empty state global
- unauthorized / access restricted state
- toast notifications (success, error, warning, info)
- global notification drawer (slide dari kanan)
- mode simulasi / what-if (global watermark state)

## Fitur Tambahan Shell (Yang Belum Ada di Template Asli)
- **Global Timer Widget** di topbar: menampilkan jam yang sedang berjalan, bisa diklik untuk log ke task tertentu
- **Universal Add Button (+)**: dropdown quick create untuk Task, Isu, Proyek, Dokumen, Reminder
- **View Switcher Component**: tabs atau dropdown untuk berpindah antara Gantt / Kanban / Table tanpa reload penuh
- **Quick Insight Panel** (right panel opsional): ringkasan sprint aktif, task tertunggak, deadline hari ini

## Prompt Stitch
```text
Design a desktop-first enterprise project management web application (PM SaaS) in Indonesian language. Keep the existing product design system consistent: dark indigo/violet left sidebar, clean white or very light gray content area, compact feature-rich top bar, clear breadcrumbs, high-density but scannable data tables, modern friendly-enterprise visual style, rounded cards, accessible status badges, and professional SaaS layout.

Create the global app shell for this desktop-first enterprise PM platform in Indonesian language.
Build:
- a dark indigo collapsible left sidebar with 7 main categories and second-level submenu navigation
- a top bar with global search, a prominent "+ Tambah Cepat" universal add button, a global timer widget (stopwatch), notification bell with badge, and user profile menu
- a breadcrumb area and dynamic page title + short description section
- a wide white content area optimized for tables, charts, kanban boards, gantt charts, tabs, and forms
- a professional modern SaaS visual style with a friendly and productive feel (not cybersecurity-dark, more like Linear, Height, or Asana)
- responsive behavior for desktop and tablet
- active, hover, selected, and collapsed navigation states for sidebar
- empty state, loading skeleton, toast notifications, and permission-restricted patterns
- an optional right panel for quick insights: sprint status, overdue tasks, today's deadline
Keep the layout modular and reusable across all pages and modules.
```

## Checklist
- [ ] Sidebar nyaman untuk ≥12 submenu
- [ ] Topbar tidak terlalu tinggi, namun kaya fitur
- [ ] Timer widget terlihat namun tidak mengganggu alur kerja
- [ ] Universal Add button menonjol dan mudah ditemukan
- [ ] Content area lebar dan responsif
- [ ] Breadcrumb konsisten
- [ ] Visual hierarchy siap untuk modul data-heavy
