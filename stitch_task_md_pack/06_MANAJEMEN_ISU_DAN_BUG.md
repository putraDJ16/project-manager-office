
# Manajemen Isu dan Bug

## 1. Tujuan Menu
Modul ini dikhususkan untuk pencatatan, pelacakan, dan resolusi masalah teknis/kerusakan (Issue & Bug Tracking), lengkap dengan penegakan Service Level Agreement (SLA) dan eskalasi otomatis.

## 2. Pengguna Utama
QA/Tester, Developer, Tim Support, Project Manager, dan Klien (Pelapor).

## 3. Urutan Eksekusi di Stitch
Modul ini memiliki 4 tahap yang berfokus pada visibilitas tingkat keparahan (Severity) dan waktu tanggap (SLA).
1. Buat **List Page (Bug Board & Daftar Isu)**
2. Lanjutkan ke **Detail Page (Issue Detail Panel & Indikator SLA)**
3. Lanjutkan ke **Create/Edit Form (Form Pelaporan Bug)**
4. Tutup dengan **Dashboard & SLA Settings (Konfigurasi Eskalasi)**

> Saran: Gunakan kontras warna yang lebih berani khusus untuk indikator Severity (Blocker, Critical) dibandingkan modul Manajemen Tugas biasa agar urgensi lebih tergambar.

## 4. Detail Desain per Halaman

### A. List Page (Issue List & Bug Board)
**Tujuan layar**
- Melihat semua antrean isu/bug yang dilaporkan dengan opsi filter spesifik (severity, status, affected module). Dapat berbentuk Tabel atau Kanban.

**Struktur layout**
- Header: Pencarian, View Switcher (List / Bug Board)
- Area konten utama:
  - *Tabel Isu*: Tampilan high-density dengan penekanan pada status bar/indikator SLA.
  - *Bug Board (Kanban)*: Lebih berfokus pada alur penyelesaian (Reported -> Investigating -> Fixing -> Ready for Testing -> Closed).

**Kolom tabel / Atribut Bug**
- ID Bug
- Judul Isu
- Severity (Badge khusus: Trivial, Minor, Major, Critical, Blocker)
- Status
- Sisa Waktu SLA (Countdown Timer: "2j tersisa" atau "SLA Terlewati")
- Modul Terdampak
- Pelapor (Reporter)
- Assignee (Resolver)

**Quick actions**
- Eskalasi manual
- Resolusi cepat
- Tautkan dengan Task

#### Prompt Stitch Tahap 1
```text
Design a desktop-first enterprise project management web application in Indonesian language.

Create the 'Issue List & Bug Board' page for the Manajemen Isu & Bug module.
Goal: Track system bugs with strong emphasis on urgency, severity, and SLA deadlines.
Include:
- page header with breadcrumb, 'Daftar Isu', View Switcher (Table, Kanban), and primary CTA "+ Lapor Bug".
- a sticky filter bar with multi-select dropdowns for Severity, Status, Pelapor, Assignee, Modul.
- a high-density data table with columns: ID Bug, Judul Isu, Severity, Status, Sisa Waktu SLA, Modul Terdampak, Pelapor, Assignee.
- use bold, highly contrasting color badges for Severity (Blocker: Dark Red, Critical: Bright Red, Major: Orange, Minor: Yellow, Trivial: Blue).
- a column for "Sisa Waktu SLA" showing an active countdown status (e.g., text '2j 45m tersisa' in green/orange, or 'SLA Terlewati' highlighted in red).
- alternative view representation: show a small tab or preview of the Kanban 'Bug Board' utilizing the same colored severity indicators on cards.
Maintain the overall clean white/indigo PM SaaS aesthetic but ensure emergency states pop out clearly.
```

---

### B. Detail Page (Issue Detail Panel & Indikator SLA)
**Tujuan layar**
- Menampilkan deskripsi menyeluruh mengenai langkah reproduksi bug, attachment bukti error, dan log pemecahan masalah dengan visibilitas SLA yang dominan. Sama seperti tugas, menggunakan *Side Panel*.

**Header & Layout Panel**
- Top action bar: Ubah Status (Dropdown besar), "Eskalasi", Tautkan ke Tugas
- Indikator SLA Countdown (Sangat menonjol di atas panel)

**Area Deskripsi Khusus Bug**
- Environment (OS, Browser, Device, Version)
- Langkah Reproduksi (Steps to reproduce - List)
- Expected Result vs Actual Result
- Lampiran Bukti (Screenshot / Video error player)

**Aktivitas & Log**
- Pembaruan status, mention developer, log waktu perbaikan.

#### Prompt Stitch Tahap 2
```text
Design the Bug Detail view using the Slide-out Side Panel (Drawer) pattern.

Include inside the panel:
- A prominent Alert/Banner at the very top displaying the "SLA Countdown Timer" (e.g., "Sisa waktu perbaikan: 1 Jam 20 Menit" on a warning yellow background).
- A top action bar with "Ubah Status" (large dropdown), an "Eskalate" icon/button, and close "X".
- The Bug Title, accompanied by a bright Severity Badge.
- A metadata section indicating Pelapor, Assignee, Modul, and Environment tags (OS, Browser, App Version).
- A structured Description area featuring distinct sections: "Langkah Reproduksi", "Expected Result", and "Actual Result".
- An Attachments gallery block optimized for viewing error screenshots and short screen records.
- An Activity/Comments log underneath, including system events like "Status changed to Investigating" or "SLA Rules triggered".
Ensure the design communicates a sense of urgency through layout and color without breaking the clean SaaS aesthetic.
```

---

### C. Create/Edit Form (Form Pelaporan Bug)
**Tujuan layar**
- Menyediakan sarana terstruktur untuk melaporkan isu, memastikan kelengkapan data teknis yang dibutuhkan developer.

**Komponen Form Utama**
- Judul Isu
- Tingkat Keparahan (Severity Dropdown dengan ikon peringatan)
- Dropdown Modul/Fitur
- Template TextBox otomatis ber-bullet untuk:
  - Langkah reproduksi
  - Perilaku aktual & Perilaku sesuai ekspektasi
- Area Drag & Drop besar untuk melampirkan screenshot
- Informasi Teknis (Versi App, Perangkat)

#### Prompt Stitch Tahap 3
```text
Design the Create/Report Bug Modal Form in Indonesian language.

Create a clean, wide modal (2-column layout) optimized for comprehensive issue reporting:
- Main Column (Left): Judul Isu (Text input), Langkah Reproduksi (Rich text with predefined bullet templates), and Expected vs Actual Result (Two text areas). Contains a large, interactive "Drag & Drop File Upload" target area specifically for error screenshots/videos.
- Side Column (Right): Fields for classification mapping: Tingkat Keparahan (Severity dropdown with color-coded icons), Modul Terdampak, Versi Aplikasi, and OS/Browser info.
- Sticky footer with "Batal" and "Kirim Laporan Bug" (Primary CTA).
Make the UI intuitive enough that non-technical clients can easily report bugs, while still capturing all technical data required by developers. Include validation states for missing mandatory fields like "Langkah Reproduksi".
```

---

### D. Dashboard SLA & Eskalasi Otomatis
**Tujuan layar**
- Layar bagi manajer/admin untuk mengatur kebijakan batas waktu penanganan (SLA) dan melihat metrik pelanggaran SLA tersebut.

**Komponen SLA Settings (Aturan)**
- Tabel Matriks SLA: Kolom (Waktu Respon, Waktu Penyelesaian) vs Baris (Blocker, Critical, dsb).
- Rule Builder Eskalasi: Logika "JIKA [SLA Blocker terlewati], MAKA [Tugaskan ke Tech Lead & Kirim Notifikasi Darurat]".

**SLA Dashboard (Metriks)**
- Rata-rata Waktu Resolusi (MTTR)
- Total Tiket Breached (Melanggar SLA) per minggu.

#### Prompt Stitch Tahap 4
```text
Design a split view for SLA Settings and Escalation Metrics dashboard.

Include two main areas on the screen:
1) SLA Policy Configuration (Settings):
   - A matrix table where admins can set "Waktu Respon" and "Waktu Penyelesaian" duration (in hours/days) mapped against Severity levels (Blocker down to Trivial).
   - An "Automated Escalation Rule Builder" UI showing an IF-THEN logic flow (e.g., "JIKA [SLA Terlewati] MAKA [Assign ke Project Manager] DAN [Kirim Email Darurat]").
2) SLA Metrics Overview (Dashboard):
   - Mini KPI cards showing: MTTR (Mean Time to Resolution), % SLA Compliance (e.g., 94%), and Total Escalated Issues.
   - A warning notification or list of currently "Escalated Bugs" demanding immediate management override.
The design should be technical yet extremely legible, using switches, editable table input fields, and clear alert indicators.
```

## 5. Aturan Konsistensi
- Badge Severity (Blocker, Critical, dsb) **berbeda** konsepnya dari badge Prioritas (High, Medium, dsb) di modul Tugas. Namun stylenya tetap mengikuti Design System globa.
- Countdown Timer SLA menggunakan warna dinamis: Hijau (waktu banyak) -> Kuning (mendekati batas) -> Merah (terlewat).

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] Dropdown severity menggunakan badge warna di semua tempat (List, Form, Detail)
- [ ] Aturan SLA (Waktu Respon & Waktu Selesai) terlihat logis input-nya di UI builder
- [ ] Bukti/lampiran dapat ditampung secara leluasa di detail panel
