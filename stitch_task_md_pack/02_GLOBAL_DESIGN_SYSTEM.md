
# Global Design System

## Tujuan
File ini dipakai setelah app shell jadi, untuk menyeragamkan tampilan semua layar di Stitch untuk aplikasi Manajemen Tugas (Project Management SaaS).

## Karakter Visual
- modern, produktif, dan bersih (seperti Linear, Asana, Notion)
- fokus pada interaktivitas (drag-and-drop, inline editing)
- estetika cerah dengan kontras yang baik untuk teks
- kepadatan data tinggi (high density) namun tetap memiliki hierarchy ruang (spacing) yang baik
- tidak menggunakan tema gelap/cybersecurity (hindari latar belakang terlalu gelap selain sidebar)

## Rekomendasi Gaya
### Warna
- Primary / Sidebar: Indigo atau Violet pekat
- Surface utama: Putih (#FFFFFF)
- Surface sekunder: Abu-abu sangat terang (#F9FAFB) untuk header tabel, sidebar mini, panel sekunder
- Accent / Brand: Indigo terang atau Biru (untuk CTA, hover states, indikator aktif)
- Success: Hijau (untuk status Selesai, On Track, Positive Budget, Under-Capacity)
- Warning: Kuning/Amber (untuk Mendekati Deadline, Risiko)
- Danger / Critical: Merah (untuk Overdue, Bug Kritis, Over-budget, Over-capacity/Burnout)
- Info: Biru muda (untuk Draft, Sedang Berjalan, Planned)

### Typography
- Font sans-serif yang clean dan geometris (seperti Inter, Roboto, Outfit, Poppins)
- Heading tegas dan tebal untuk judul halaman
- Body text ringkas dan mudah dibaca dalam satu lirik mata
- Metadata, tanggal, atau atribut sistem menggunakan teks sekunder (abu-abu sedang) dengan ukuran lebih kecil
- Font monospace (Opsional) untuk ID tiket, ID bug, atau code snippet di detail 이슈

### Spacing dan Grid
- Gunakan 8px / 4px spacing system
- Cards menggunakan medium radius (misalnya 8px atau 12px) dengan border sangat halus/tipis, tanpa drop-shadow yang berat (gunakan shadow lembut dan sangat transparan)
- Content menggunakan fluid/12-column grid
- Gap tabel rapat agar memuat banyak data (high density)
- Section margin cukup untuk membedakan kelompok informasi di detail/form view

### Komponen Global Inti
- Gantt bar (dengan indikasi warna, dependensi panah, dan fill gradient untuk persentase selesai)
- Kanban card (compact, drag-friendly indikator, avatar member, dan subtask counters)
- Progress ring/bar (Donut chart kecil untuk roll-up summaries task -> milestone -> project)
- Timer widget (widget kecil dengan angka digital berjalan yang bisa melayang atau disematkan di topbar)
- Data table dengan Classic View (mirip spreadsheet: resize kolom, bulk checkbox, sort)
- Side panel / Drawer untuk task detail tanpa meninggalkan list view
- Tabs navigasi (untuk detail view yang kompleks)
- Status badges (berbagai variasi bentuk dan warna sesuai severity / status / priority)
- Date picker / Range picker
- Select dropdown dengan visual "Best Fit" (menampilkan avatar, kapasitas, skill label)

## Badge Status yang Disarankan
**Prioritas Tugas**
- Rendah (Abu-abu / Biru muda)
- Sedang (Kuning / Oranye)
- Tinggi (Merah muda)
- Kritis (Merah pekat)

**Status Pengerjaan**
- To-do / Open (Abu-abu / Outline)
- In Progress (Biru)
- Review (Ungu)
- Selesai / Resolved (Hijau)
- Blocked / Overdue (Merah)

**Tingkat Keparahan Bug (Severity SLA)**
- Trivial
- Minor
- Major
- Critical
- Blocker

**Indikator Tambahan**
- Loop/Recurrence Icon (untuk tugas berulang)
- Milestone marker (ikon bendera/diamond di Gantt)
- Escalated (ikon peringatan/api)

## Aturan Konsistensi
- Urutan warna dan makna warna untuk severity, prioritas, status harus persis sama di semua modul
- Visual badge harus selalu konsisten (contoh: semua badge prioritas menggunakan solid background + text putih, atau pale background + text berwarna)
- Area klik (hit box) untuk drag-and-drop harus jelas (misalnya: kursor berubah jadi grabber hand atau ada icon dots 6 untuk handle)
- Pola interaksi inline edit: misalnya, klik pada "Due Date" di Kanban card langsung membuka dropdown kalender

## Prompt Stitch
```text
Design a comprehensive, reusable design system for a desktop-first enterprise project management platform (PM SaaS) in Indonesian language.
Use:
- dark indigo/violet for the sidebar and white/light gray background surfaces for content
- modern, bright, productive aesthetics (similar to modern work tools like Linear or Asana, avoid dark-mode cybersecurity feel)
- crisp, geometric sans-serif typography (e.g., Inter, Roboto)
- compact, high-density enterprise 8px spacing system
- flat but slightly rounded cards with very light shadows and minimal borders

Design the key UI components specifically needed for task and project management:
- Gantt chart bars (showing progress fill, dependency arrows, milestone markers)
- Kanban cards (compact: title, assignee avatar, subtask counters, labels, clear drag handle)
- Progress visualizations (small donut charts, progress bars for task roll-ups)
- Timer widget UI (digital clock, play/pause controls, task association dropdown)
- Accessible, color-coded status badges (Priority: Low, Med, High, Critical. Status: Open, In Progress, Review, Done. Severity: Blocker, Critical, Major, Minor, Trivial. Indication: Overdue, On Track)
- Spreadheet-like data tables (with resizable columns, bulk checkboxes)
- Modals, drawers (side panels), tabs, filter bars, date range pickers, and interactive dropdowns (e.g., displaying assignee capacity/skills)
- Toast notifications and inline validation

Show how these components combine to maintain consistency across lists, boards, charts, and detail views. Make the UI feel highly interactive, deeply data-rich, yet readable.
```

## Checklist
- [ ] Aesthetic cerah dan produktif (bukan dark theme)
- [ ] Komponen spesifik PM terdefinisi: Kanban card, Gantt bar, Timer widget
- [ ] Warna untuk status, prioritas, severity memiliki kontras yang baik dan logis
- [ ] Hierarchy typography terstruktur untuk membedakan judul, text utama, dan metadata
