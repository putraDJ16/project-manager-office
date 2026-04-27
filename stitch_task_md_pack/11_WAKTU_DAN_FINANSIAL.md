
# Waktu dan Manajemen Finansial (Time & Budget)

## 1. Tujuan Menu
Modul ini merajut pencatatan waktu tingkat personal (Timesheet), pemantauan biaya anggaran agregat (Budget), serta analisa kesehatan proyek tingkat tinggi seperti *Earned Value Management* (EVM).

## 2. Pengguna Utama
Anggota Tim (pencatatan waktu harian), Project Manager (Persetujuan & Anggaran), Pimpinan PMO / Manajemen Eksekutif.

## 3. Urutan Eksekusi di Stitch
1. Buat **Global Timer Widget & Log Singkat**
2. Lanjutkan ke **Timesheet Manual View & Approval Matrix**
3. Lanjutkan ke **Project Budget Config & Burn-down Cost**
4. Tutup dengan **EVM Dashboard (Scorecards PV/EV/AC, SPI/CPI)**

## 4. Detail Desain per Halaman

### A. Global Timer Widget & Log Cepat
**Tujuan layar**
- Merancang pelacak stopwatch terintegrasi yang senantiasa *accessible* di mana pun pengguna berada di dalam antarmuka.

**Struktur Layout**
- Widget angka digital melayang (FAB) atau menetap di *Top Menu Navigation*.
- Tombol esensial: Play, Pause, Stop.
- Saat Log/Stop dipencet: Modal/Popover Mini muncul, dengan bidang auto-fill "Tugas yang Dikerjakan" (berdasarkan konteks tugas terakhir), serta kolom Deskripsi catatan opsional, dan tombol Simpan.

#### Prompt Stitch Tahap 1
```text
Design the Global Timer Widget and Quick Time-Log mechanism for an enterprise PM platform.

Include two interconnected UI components:
1) Global Timer UI: A compact, modern stopwatch indicator nestled consistently in the Top Navigation Bar (or as a small floating widget). Show active state: Play/Pause/Stop control icons and a digital counter running (e.g., '02:15:30').
2) Log Time Popover: The modal/popover that opens when 'Stop/Log' is clicked. Ensure it includes an autocomplete "Task Association" lookup field (defaulting to the user's currently focused task), a short "Notes/Descriptions" text area, and primary "Simpan Log Waktu" save button.
The design should be crisp, un-intrusive, utilizing the bright SaaS white/indigo design system.
```

---

### B. Timesheet Manual & Approval Matrix
**Tujuan layar**
- Kalender logis mingguan (*Weekly View*) bagi anggota tim untuk mencatatkan waktu (Jam:Menit) secara blok matrik. Ditambah tampilan Dashboard Persetujuan (*Approval*) bagi Manajer.

**Struktur Layout (User Timesheet)**
- Header: Rentang Tanggal Mingguan, Tombol Kirim Approval ('Submit for Approval').
- Tabel: Sisi kiri = Daftar Proyek & Daftar Tugas. Kolom-kolom = Sen, Sel, Rab, Kam, Jum, Sab, Min, Total Jam. Isian kotak berfokus pada slot waktu.
- Total Sum Bar di bawah tabel mendaftar rekapan total mingguan per hari.

**Struktur Layout (Manager Approval)**
- Daftar orang di tim dan total jam yang ia "Submit".
- Indikator centang (Approve All) atau Rincian. Panel geser untuk melihat catatan detail harian tiap anggota sebelum menyetujui, dan text box alasan "Reject" (Penolakan).

#### Prompt Stitch Tahap 2
```text
Design the multi-role Weekly Timesheet and Approval interface.

Create two distinctive views:
1) User's Weekly Grid View: A spreadsheet-like matrix where rows are Project/Task names, and columns represent the 7 days of the specified week. Cells must allow quick manual time input (e.g., "4h 30m"). Bottom row calculates daily totals. Top action bar includes a bold "Kirim untuk Persetujuan" (Submit) button.
2) Manager's Approval Dashboard: A clean vertical list identifying pending team members. Each row summarizes Total Submitted Hours and associated Projects. Provide clear "Approve" (Green Check) and "Reject" (Red X) toggle buttons per row. Include a quick bulk-action UI to "Setujui Semua" and a popover area to specify rejection reasons if returned.
```

---

### C. Project Budget Setup & Planned vs Actual Cost (Dashboard)
**Tujuan layar**
- Merancang penetapan nilai anggaran uang dan pemantauan pengurasannya berakibat dari *billing-rates* dikali waktu kerja aktual.

**Struktur Layout Setup**
- Form Input Tarif Biaya SDM (*Resource Billing Rates*, per user atau per role rate Rp/Jam).
- Konfigurasi Fixed Cost tambahan proyek.

**Struktur Layout Dashboard Anggaran**
- Progress Bar Budget utama (Horizontal memanjang: Rp. Terpakai vs Sisa Budget).
- Line/Area Chart Burn-down/Burn-up memanjat kalender timeline:
  - Sumbu X: Tanggal Proyek.
  - Sumbu Y: Valuasi Uang.
  - Dua Garis saling berjejeran: *Planned Cost* (Rencana Estimasi) vs *Actual Cost* (Akumulasi Pengeluaran Waktu x Tarif).

#### Prompt Stitch Tahap 3
```text
Design the Budget Configuration and Monitoring Dashboard.

Focus on clear financial tracking visualizing money vs timeline flow:
- Configuration Panel: A structured input table setting 'Billing Rates' per hour individually for team members or roles (e.g., Lead Developer = Rp 250,000/hr) and capturing project "Fixed Costs".
- Dashboard View: A prominent, wide 'Budget Progress Bar' visually distributing "Anggaran Terpakai" (Spent) against "Sisa Anggaran" (Remaining), turning to a warning color if >90% spent.
- The Core Visual: A 'Planned vs Actual Cost' line/area chart plotted over the project's timeline (X-axis). Clearly distinguish the "Planned/Baseline Cost trajectory" (perhaps a dotted or solid blue line) against the "Actual Accumulating Cost" (a solid red or teal line tracking closely to the plan). Include informative data tooltips when hovering over dates.
Ensure financial figures are legible and correctly formatted (e.g., using thousands separators).
```

---

### D. Earned Value Management (EVM) Scorecards
**Tujuan layar**
- Mentransformasi data rumus PM berat (PV, AC, EV, SPI, CPI) menjadi visual gauge eksekutif yang sangat rapi dan instan terbaca. C-Level Executive Dashboard.

**Visual Dashboard C-Level:**
- **3 Box Utama**: PV (Planned Value), AC (Actual Cost), EV (Earned Value). Sertakan definisi singkat.
- **2 Speedometer Gauge/Donut Chart**:
  - SPI (Schedule Performance Index). Jarum >1 = Hijau (mendahului).
  - CPI (Cost Performance Index). Jarum >1 = Hijau (hemat/di bawah budget).
- Teks dinamis AI Auto-Summary di bawah indikator Gauge (Misal: "Proyek terlambat 12% dari jadwal, membengkak secara ongkos 8%").

#### Prompt Stitch Tahap 4
```text
Design the Earned Value Management (EVM) Executive Dashboard.

Focus on high-level, critical performance indicators designed for senior management scanning:
- Setup a top row of three bold 'Scorecards': Planned Value (PV), Earned Value (EV), and Actual Cost (AC). Display absolute currency amounts in large typography. Add a small 'info tooltip icon' explaining each acronym.
- Underneath, design two striking circular 'Gauge Dials' (like speedometers) or Donut Charts tracking index ratios:
  1) Schedule Performance Index (SPI)
  2) Cost Performance Index (CPI)
- The Gauges must use semantic coloring clearly communicating health: <1.0 = Red (Delayed/Over-budget), 1.0 = Blue/Gray (On target), and >1.0 = Green (Ahead/Under-budget).
- Conclude with an auto-generated "Summary Sentence" component directly below the dials translating the metrics into plain human language (e.g., "Proyek ini berjalan lebih lambat 10% dari jadwal, namun menghemat biaya 5%").
```

## 5. Aturan Konsistensi
- Pewarnaan nominal uang patokan (Anggaran Habis) dan grafik status merah-hijau pada EVM harus sejalan dengan indikator sehat/risiko sistem secara universal.
- Widget Jam/Tombol Timer harus tetap responsif tanpa menutup menu utama saat bergulir (*scrolling*).

## 6. Checklist Sebelum Lanjut ke Sesi Eksekusi Penuh (Finishing)
- [ ] Angka nominal jelas keterbacaannya.
- [ ] Diagram pada Dashboard Anggaran dan EVM *Executive-Ready*.
- [ ] Timesheet memiliki kapabilitas entri masif namun intuitif secara UX.
