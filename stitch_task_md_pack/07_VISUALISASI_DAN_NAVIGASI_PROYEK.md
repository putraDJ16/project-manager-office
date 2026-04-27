
# Visualisasi dan Navigasi Proyek

## 1. Tujuan Menu
Modul ini berfungsi sebagai "Lensa" atau "View" berbeda untuk melihat kumpulan data proyek yang sama. Modul ini berfokus pada navigasi waktu (Gantt) dan status alur kerja harian (Kanban).

## 2. Pengguna Utama
Manajer Proyek, Pimpinan Tim (Team Lead), dan Eksekutif (Pemantau). 

## 3. Urutan Eksekusi di Stitch
Modul ini bertumpu pada interaksi *drag-and-drop* tingkat lanjut dan manipulasi *timeline*.
1. Buat **Gantt Chart Interaktif (Epic 9)**
2. Lanjutkan ke **Gantt Advanced (Critical Path & Baselines)**
3. Lanjutkan ke **Kanban Board**
4. Tutup dengan **Classic View (Matriks Tabel Padat)**

> Saran: Karena *view* ini memuat data dalam jumlah besar/massal, pastikan UI tidak terlalu *cluttered*. Sediakan fitur zoom dan sticky headers/columns.

## 4. Detail Desain per View

### A. Gantt Charts Interaktif
**Tujuan layar**
- Merencanakan dan mengubah jadwal pelaksanaan beserta dependensi tugas secara visual.

**Struktur layout**
- Kiri: Tabel daftar Tugas (mirip kolom WBS) tapi bisa disembunyikan/diciutkan.
- Kanan: Area kalender horizontal (Timeline Grid) yang tak terbatas, dengan kontrol zoom (Hari/Minggu/Bulan).
- Komponen *Task Bar*: Bar horizontal yang merepresentasikan rentang waktu. Mendukung *drag-and-drop* keseluruhan dan *resize* ujungnya.
- Elemen *Dependency*: Panah lengkung (Arrow connector) dari ekor satu bar ke kepala bar lainnya (Ketergantungan Finish-to-Start).

#### Prompt Stitch Tahap 1
```text
Design an interactive Gantt Chart View for a desktop enterprise project management platform.

Layout:
- A split pane: Left side containing a minimal, collapsible Task List table. Right side (dominant) containing a horizontally scrolling Timeline Calendar grid.
- Include zoom controls for the timeline (Day/Week/Month).
- Task Bars displayed on the grid must look interactive with hover states. Include drag handles on the left/right edges for duration resizing.
- Draw clear, curving connector arrows between Task Bars to indicate task dependencies.
- Show a brief tooltip design (on hover) containing Task Name, Start/End Dates, and Progress Status.
The aesthetic should be clean, employing distinct task colors (maybe mapping to their Status) on a wide canvas, keeping the feeling light and highly responsive.
```

---

### B. Gantt Advanced (Critical Path & Baselines)
**Tujuan layar**
- Melihat penyimpangan jadwal secara langsung dan mengidentifikasi jalur esensial yang menahan proyek. 

**Komponen Tambahan pada Gantt**
- **Toggle: Highlight Critical Path**: Semua *Task Bar* yang tidak tergabung dalam critical path memudar (opacity 40%), sementara bar dan panah *critical path* menyala kemerahan (neon red atau bold outline).
- **Toggle: Tampilkan Baseline (Rencana)**: Muncul bar abu-abu tipis statis (Ghost Bar) tepat di bawah *Task Bar* asli sebagai jangkar perbandingan jadwal.

#### Prompt Stitch Tahap 2
```text
Enhance the Gantt Chart Design with advanced scheduling features: Critical Path and Baselines.

Include these visual modifications on the same Gantt layout:
1) Add toggle switches on the top toolbar: "Highlight Critical Path" and "Tampilkan Baseline".
2) Simulate the Critical Path active state: Make non-critical tasks visually recede (lower opacity), while the chain of Critical Path tasks and their connecting arrows are highlighted using a striking alert color (like bold red/orange or glowing outline).
3) Simulate the Baseline active state: Underneath the main colored Task Bars, display thinner, static "Ghost/Shadow Bars" (grayed out) representing the original planned schedule. Include a visual cue (like a red overlapping section) if the active Task Bar has delayed past its Baseline.
```

---

### C. Kanban Board View
**Tujuan layar**
- Memantau pergerakan harian tiap unit tugas secara operasional berdasarkan kolom status. (Berbeda dari Sprint Board, Kanban ini sifatnya continous).

**Struktur Layout**
- Header: Pencarian cepat, filter (Assignee, Label), dan pengelompokan (Swimlanes).
- Kolom: Backlog, To Do, In Progress, In Review, Ready to Deploy, Done.
  - Setiap kolom memiliki counter angka jumlah tugas yang dibatasi oleh limit WIP (*Work-In-Progress limits*, muncul sebagai *warning* jika kepenuhan).
- *Interaksi Card*: Bayangan halus (*drop shadow*) ketika kartu ditekan & ditarik, dan penanda *drop zone* pada kolom.

#### Prompt Stitch Tahap 3
```text
Design a continuous Kanban Board view.

Include:
- A sticky column header layout (e.g., To Do, In Progress, Review, Done).
- Distinct Work-In-Progress (WIP) limit indicators on column sub-headers. Show a subtle warning state (e.g., red text "5/3") if a column exceeds its limit.
- Task Cards that are well-structured yet dense, showing Title, priority color line, labels, and Assignee avatar.
- Display a "Dragged State" visual: show one card slightly enlarged, angled, or possessing a heavier drop-shadow as it's being dragged, along with a dashed-outline "drop zone" highlighting where it will land in the adjacent column.
```

---

### D. Classic & Plain View (Tabel Matriks)
**Tujuan layar**
- Memberikan UI sepadat *spreadsheet* untuk pengeditan massal (Bulk Action), sorting berganda, dan export/import data.

**Struktur Layout**
- Kontrol kepadatan (Density Toggle: Comfortable, Compact).
- Tabel dengan kolom yang bisa di-*resize* lebar/sempit (handle resize).
- Fitur *Bulk Action* (opsi checkbox multi-select pada baris). Jika diseleksi, *Sticky Floating Bar* muncul di bagian bawah layar berisi action: (Update Assignee, Ganti Status, Hapus, Export).

#### Prompt Stitch Tahap 4
```text
Design the 'Classic / Plain View' — a high-density, spreadsheet-like data matrix view for project tasks.

Focus purely on managing raw data efficiently:
- A table utilizing the "Compact" density setting (minimal vertical padding per row).
- Clear visual indicators that columns can be resized (resize handles on header borders) and sorted.
- Simulate an active "Multiple Selection / Bulk Action" state: Checkboxes in the first column are ticked for multiple rows, causing a prominent "Floating Bulk Action Bar" to anchor at the bottom of the screen.
- This Floating Bar should contain buttons like: Ubah Assignee, Update Status, Hapus Massal, and Export, styled distinctly to grab attention but floating gracefully over the table content.
```

## 5. Aturan Konsistensi
- Pastikan bahwa perpindahan dari satu *View* ke *View* lainnya di modul ini harus sesingkat dan selancar mungkin. Penggunaan "View Switcher" Dropdown di Header Title lebih disarankan ketimbang tab agar menghemat ruang vertikal.
- State kosong (Empty State) untuk Gantt apabila belum ada tugas berjadwal wajib komunikatif (contoh: ilustrasi kalender kosong dan tombol start planning).

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] Transparansi Critical Path/Baseline mudah dipahami
- [ ] Indikator status WIP pada Kanban jelas
- [ ] Density pada Classic View cukup untuk mengedit massal seperti *Excel*.
