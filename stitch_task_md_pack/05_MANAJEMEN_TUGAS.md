
# Manajemen Tugas

## 1. Tujuan Menu
Modul ini adalah *core engine* aplikasi, digunakan untuk mengelola proyek dari level tertinggi (WBS) hingga level operasional (Tasks, Subtasks, dan Sprints).

## 2. Pengguna Utama
Project Manager, Scrum Master, Seluruh Anggota Tim.

## 3. Urutan Eksekusi di Stitch
Modul ini memiliki 4 tahap karena mencakup berbagai interaksi kompleks.
1. Buat **List Page (WBS & Task List View)**
2. Lanjutkan ke **Detail Page (Task Panel & Subtasks)**
3. Lanjutkan ke **Create/Edit Form (Milestone & Recurrence Settings)**
4. Tutup dengan **Dashboard Sprints (Backlog & Active Sprint Board)**

> Saran: Fokus pada interaksi "inline editing" dan layout "side panel" saat menggarap modul ini agar terasa seperti PM SaaS sungguhan.

## 4. Detail Desain per Halaman

### A. List Page (WBS & Task List View)
**Tujuan layar**
- Melihat struktur proyek secara hierarkis dan daftar tugas dalam matriks grid/tabel.

**Struktur layout**
- Header: breadcrumb, judul proyek, navigasi "View Switcher" (List, Kanban, WBS)
- Area konten utama:
  - *WBS View*: Tampilan hierarki (TreeView) dengan indentasi vertikal (Project > Milestone > Task List > Task > Subtask)
  - *List View*: Tabel grid yang padat, dikelompokkan berdasarkan Task List ("Desain UI", "Pengembangan API")

**Kolom tabel / Atribut Task**
- ID Unik Tugas
- Judul Tugas
- Assignee (Avatar)
- Due Date
- Prioritas (Badge warna)
- Status (Badge warna)
- Indikator Subtask (misal: 2/5 selesai)
- Indikasi Tugas Berulang (Icon Loop)

**Quick actions (di dekat task row)**
- Tambah Subtask Cepat
- Ganti Assignee Inline
- Ganti Status Inline

**Output yang diharapkan dari Stitch**
- Tabel responsif yang menangani indentasi WBS dengan rapi
- "Roll-up summary" progress: misal, Task List "Desain UI" menunjukkan "(60% selesai, 3/5 tugas)"

#### Prompt Stitch Tahap 1
```text
Design a desktop-first enterprise project management web application in Indonesian language. Keep the existing product design system consistent: bright modern aesthetic, indigo sidebar, white content area, high-density data, round-corner cards, and inline-editable metadata.

Create the 'WBS & Task List' view page for the Manajemen Tugas module.
Goal: Manage hierarchical structure (Project > Milestone > Task List > Task > Subtask).
Include:
- page header with breadcrumb, project title, and a View Switcher (Tree View, List View, Board).
- primary CTA "+ Tambah Tugas".
- a high-density data table displaying a hierarchical Tree/WBS View. Use clear indents and expand/collapse chevrons for nested items.
- table columns: ID Tugas, Judul Tugas, Assignee (Avatar), Due Date, Prioritas (color badge: Low, Med, High, Critical), Status (color badge: Open, Progress, Review, Done).
- visual indicators for Subtask completion (e.g., text "2/5" or a mini progress ring) and Recurrence (loop icon).
- roll-up summary indicators on parent rows (Milestone or Task List rows) showing aggregate progress percentages.
- inline quick actions on hover (add subtask, menu dots).
Use clean padding, alternating row colors (or subtle borders), and ensure it feels highly interactive.
```

---

### B. Detail Page (Task Detail Panel & Subtasks)
**Tujuan layar**
- Melihat, melengkapi, dan berkolaborasi dalam satu tugas spesifik. Menggunakan pola *Side Panel/Drawer* agar konteks tabel di latar belakang tidak hilang.

**Header & Layout Panel**
- Top bar panel: Mark as Done (checkbox besar), ID Tugas, Menu(dots), Close (X)
- Judul Tugas (Ukuran besar, editable textarea)

**Atribut Tugas (Grid Inline Edit)**
- Assignee
- Tgl Mulai & Tenggat
- Prioritas
- Task List Induk / Milestone
- Estimasi Jam (opsional)

**Area Deskripsi & Subtasks**
- Rich text area untuk instruksi detail
- Daftar Subtask: Checkbox, Nama subtask, Assignee subtask
- Area komentar (Activity / Chat thread berurutan ke bawah)

#### Prompt Stitch Tahap 2
```text
Design the Task Detail view using a Slide-out Side Panel (Drawer) pattern coming from the right side over the Task List.
The aesthetic should be clean, feeling fast and highly interactive (PM SaaS style).

Include inside the panel:
- A top action bar: "Mark Complete" checkmark, Task ID, "..." menu, and a "Close" icon.
- A large, inline-editable Task Title.
- A metadata section arranged in a 2-column or wrapping grid (Assignee avatar + name, Start/Due Date, Status Badge, Priority Badge, Milestone link). Make these appear clickable/editable.
- A "Subtasks" section featuring a progress bar, an inline input to quickly add a subtask, and a list of existing subtasks with their own checkboxes and mini-assignee avatars.
- A rich text Description area with formatting toolbar placeholders.
- A combined "Activity & Comments" section at the bottom, with a text input box fixed above or at the bottom of the feed for writing comments.
The design should fit comfortably within the right-third or half of a desktop screen.
```

---

### C. Create/Edit Form (Milestone & Recurrence)
**Tujuan layar**
- Form khusus untuk membuat elemen besar seperti Milestone, atau mengatur Tugas Berulang (Recurrence) dan Pengingat (Reminders).

**Tampilan Recurrence Settings (Modal)**
- Frekuensi: Harian, Mingguan, Bulanan, Custom
- Pengulangan: Setiap [angka] minggu, pada hari [Senin, Selasa]
- Berakhir pada: Tanggal / Setelah N kejadian

**Tampilan Reminders (Dropdown/Popover)**
- Pilih waktu ingatan: "1 hari sebelum", "2 jam sebelum tenggat", "Custom"
- Saluran: "Notifikasi In-App", "Email"

#### Prompt Stitch Tahap 3
```text
Design the configuration modals for Advanced Task Features: Milestones and Recurrence/Reminders in Indonesian.

Create two interactive modal UI flows:
1) Milestone Form Modal: Fields for Nama Milestone, Tanggal Mulai, Tenggat Waktu, Penanggung Jawab (Dropdown with search avatar), and a description.
2) Recurrence & Reminder Settings Modal:
   - "Tugas Berulang" section: Dropdowns for frequency (Harian, Mingguan, Bulanan), day multi-select (e.g., pill buttons for Sen, Sel, Rab), and End Condition (Tanggal tertentu).
   - "Pengingat" section: A rule builder to add alerts (e.g., "Ingatkan saya [1 hari] sebelum batas waktu via [In-App Notification]").
Keep the modals clean, using the established indigo/white modern PM SaaS design system, with clear Cancel/Simpan actions in sticky footers.
```

---

### D. Dashboard Sprints (Agile / Sprint Board)
**Tujuan layar**
- Ruang kerja khusus untuk metodologi Agile/Scrum. Menampilkan Backlog, Sprint aktif, dan metrik Sprint.

**Komponen Utama**
- **Kanban Board** (Active Sprint): Kolom To Do, In Progress, In Review, Done.
  - Kartu padat (Task Card) bisa di-drag-and-drop antar kolom.
- **Sprint Header**: Nama Sprint, Sisa Hari (Sprint Days Left), Tombol "Complete Sprint".
- **Backlog Panel** (di sisi lain atau halaman terpisah): Daftar task yang menunggu ditarik ke Sprint.

#### Prompt Stitch Tahap 4
```text
Design the Active Sprint (Kanban Board) module for a desktop-first Agile project management layout in Indonesian language.

Include:
- A Sprint Header showing the Sprint Name, Dates, a "Sisa x Hari" (days left) indicator, a mini Sprint Burn-down sparkline, and a primary CTA "Selesaikan Sprint".
- The main Kanban Board area with standard columns: To Do, In Progress, In Review, Selesai.
- Task Cards inside columns. Each card must be compact but dense, displaying: Task Title, Priority color stripe or badge, ID, Subtask ratio (e.g., 2/4), and the Assignee's circular avatar.
- Visual cues for drag-and-drop interaction (e.g., a card slightly lifted with a soft shadow over a drop-zone highlight).
- A collapsible left side-panel or drawer labeled "Backlog" containing a vertical list of tasks ready to be dragged into the sprint columns.
Ensure the layout maximizes horizontal space for columns, feeling fast and responsive.
```

## 5. Aturan Konsistensi
- Indikator Prioritas dan Status pada tabel (List) harus sama persis logikanya dengan di detail panel dan di kartu Kanban.
- Gaya Dropdown Assignee (Avatar + text) harus seragam.
- Jangan ciptakan halaman baru untuk detail; usahakan pop-up modal atau side panel dipertahankan.

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] List View mendukung hierarki (indentasi sub-item)
- [ ] Task Detail UI berbentuk Side Panel
- [ ] Pengaturan tugas berulang & reminder jelas penggunaannya
- [ ] Active Sprint (Kanban) menampilkan komponen drag & drop yang meyakinkan
