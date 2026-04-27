
# Shared Page Pattern

## Tujuan
File ini menjadi referensi pola halaman yang harus konsisten di semua menu modul dalam aplikasi Manajemen Tugas. Pola ini mengadaptasi alur "List -> Detail -> Form -> Dashboard" yang dioptimalkan untuk project management.

## 1. List Page Pattern (Board/Tabel)
### Komposisi
- breadcrumb (opsional di level top navigasi)
- page title + deskripsi singkat
- View Switcher (List | Kanban | Gantt) di sebelah judul
- CTA primer (misal: "Tambah Tugas Baru")
- KPI summary row (opsional, misal: To Do 5 | In Progress 2 | Done 10)
- filter bar and search (sticky)
- area konten utama (Tabel High-Density, Kanban Board, atau Gantt Chart)
- panel sekunder (off-canvas/drawer dari kanan) untuk detail item

### Rule
- pencarian selalu di sisi kiri/kanan filter bar
- action massal (bulk action checkbox) memunculkan floating action bar di bawah layar (opsional)
- pagination/infinite scroll di bawah tabel
- detail item *tidak* pindah ke URL baru jika memungkinkan, melainkan membuka "Side Panel" (Drawer) untuk interaksi cepat

## 2. Detail Page Pattern (Side Panel / Drawer)
Karena produktivitas sangat penting di PM tool, sebagian besar detail task dibuka dalam bentuk Panel Kanan yang lebar (Side Drawer). Untuk item besar seperti Proyek atau Milestone, gunakan Full Page Detail.

### Komposisi (Untuk Panel/Full Detail)
- top action bar (Copy link, Delete, Close)
- judul item (inline editable)
- meta properties (Status, Assignee, Due Date, Priority) dalam bentuk grid atau list dengan inline dropdown
- area deskripsi lengkap (Rich text editor)
- subtasks section (checklist)
- relasi (Lampiran, Isu Terkait, Git Commits)
- area komentar dan activity history di paling bawah

### Rule
- properti harus gampang diedit langsung tanpa tombol "Edit" form penuh
- tab tidak terlalu dalam; gunakan vertical scrolling untuk melihat subtask dan lampiran
- komentar adalah interaksi prioritas

## 3. Form Page Pattern (Create/Edit Modal atau Full Page)
### Komposisi
- header judul form
- two-column layout untuk menghemat ruang vertikal
- informasi utama (Nama, Deskripsi) menggunakan lebih banyak ruang
- properti metadata (Tipe, Assignee, Tanggal) di kolom samping (jika modal besar)
- upload area untuk attachments
- checklist subtask awal (opsional)
- sticky footer untuk action (Save, Cancel, Create & Add Another)

### Rule
- error validation muncul langsung saat field ditinggalkan (on blur)
- mandatory fields (*asterisk*) harus jelas
- dukung "Create & Add Another" agar pembuatan tugas berulang lebih cepat

## 4. Dashboard / Report Pattern
### Komposisi
- date range picker dan project context filter (global filter)
- deretan KPI cards angka besar
- 2 atau 3 chart utama berdampingan (burn-down, heatmap, bar chart)
- tabel "Needs Attention" atau "Recent Exceptions" di bagian bawah
- tombol export (PDF/CSV) di atas atau dekat chart spesifik

### Rule
- chart harus punya legend dan tooltip yang informatif
- tabel di panel bawah dibuat *actionable* (misal bisa klik untuk pergi ke task bermasalah)
- layout modular mengizinkan widget bisa ditata ulang (opsional)

## Prompt Stitch
```text
Create reusable page patterns for a desktop-first enterprise project management platform (PM SaaS) in Indonesian language.

Show 4 layout templates, utilizing a modern, bright, productivity-focused design:
1) List/Board Page: containing a View Switcher (List/Kanban/Gantt), sticky filter bar, high-density table or board area, and a global "+" CTA.
2) Detail View (Side Panel/Drawer format): featuring inline-editable title, grid-based inline-editable metadata (assignee, due date, status, priority), rich text description, subtasks checklist, attachments, and combined comment/activity feed section at the bottom.
3) Create/Edit Form (Large Modal): organized into a main column for descriptive content and a side column for status/metadata, with sticky footer actions ("Simpan" and "Simpan & Buat Baru").
4) Contextual Dashboard/Report: containing date filters, top KPI metric cards, comparative charts (e.g., bar or line graphs with tooltips), and an actionable exception-list table below.

Each template must be modular, highly interactive, and visually consistent with a light/white background and indigo accents, optimized for fast data entry and scanning.
```

## Checklist
- [ ] Pola Side Panel Drawer mempermudah buka-tutup detail tanpa hilang konteks daftar
- [ ] Inline editing difasilitasi di halaman detail
- [ ] List page mengakomodasi berbagai jenis "View"
- [ ] Template reusable untuk semua modul (Tugas, Isu, SDM, dll)
