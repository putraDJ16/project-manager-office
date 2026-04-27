
# Manajemen Sumber Daya Manusia (SDM) / Resource Management

## 1. Tujuan Menu
Modul ini dikhususkan bagi Manajer Proyek dan Resource Manager untuk memantau kapasitas tim (kapasitas harian/mingguan), mencegah *burnout*, menugaskan orang yang tepat, dan mensimulasikan perubahan jadwal.

## 2. Pengguna Utama
Resource Manager, Project Manager, Pimpinan Tim (Team Lead).

## 3. Urutan Eksekusi di Stitch
1. Buat **Workload Bar View & Heatmap**
2. Lanjutkan ke **Simulasi What-if (Global State)**
3. Lanjutkan ke **Best Fit Suggestion (Assignee Dropdown)**

> Saran: Porsi terbesar modul ini adalah pemanfaatan Visualisasi Data (*Heatmaps* dan *Bar Charts*) serta representasi Visual dari Kapasitas (Hijau-Kuning-Merah).

## 4. Detail Desain per Halaman

### A. Workload Bar View & Heatmap
**Tujuan layar**
- Melihat gambaran agregat kapasitas tim dalam suatu rentang waktu. Ada dua tab atau toggle view: Bar (Batang) dan Heatmap (Kepadatan).

**Struktur Layout**
- Header: Filter (Departemen, Proyek, Skill), Date Range Picker.
- Sub-Header: View Switcher (Bar Chart | Heatmap).
- Konten (*Bar View*): Chart bar ditumpuk (Stacked Bar). Sumbu y = Anggota Tim, Sumbu x = Tanggal. Tinggi/Panjang bar merepresentasikan total jam task bertumpuk pada hari itu.
- Konten (*Heatmap View*): Tabel Grid (Baris=Anggota Tim, Kolom=Hari). Setiap sel memiliki *fill color* sesuai densitas kerja (Hijau=Available/Optimal, Merah gelap=Over-allocated).

#### Prompt Stitch Tahap 1
```text
Design the Workload Report dashboard featuring a toggle between 'Bar View' and 'Heatmap View'.

Include:
- A top control bar with filters (Departemen, Peran) and a Date Range calendar.
- The 'Heatmap View' layout: A matrix table where rows are Team Members (Avatar + Name + Role) and columns are Days of the Week/Month.
- Ensure the cells in the Heatmap are color-coded based on capacity: Light Gray/Blue (Under-allocated/Free), Green (Optimal 8hrs), Yellow (Nearing capacity), and Dark Red (Over-allocated/Burnout).
- The 'Bar View' layout (shown as an alternative design or a tab): Horizontal stacked bar charts per team member showing total accumulated hours over a timeline axis.
Use clean, distinct tooltip designs when hovering over a red cell or bar to show the exact intersecting tasks causing the overload.
```

---

### B. Simulasi What-if (Global State & Drag-and-Drop)
**Tujuan layar**
- Menguji redistribusi beban kerja dalam "Sandbox Mode" tanpa memengaruhi data sesungguhnya sebelum konfirmasi.

**Struktur Layout (di atas halaman Workload Reports)**
- Tombol Toggle "Mode Simulasi Aktif".
- Saat aktif, antarmuka layar Workload Report berubah status:
  - Header/Border menjadi warna khas (misal: Orange/Ungu Strip) dengan watermark "SIMULATION MODE".
  - Ada floating action bar di bawah: "Simpan Perubahan" atau "Batal".
- Di mode ini, kotak tugas pada Bar/Heatmap dapat didrag dan di-drop ke baris/user lain. Perubahan warna *real-time* (dari merah ke hijau jika beban dipindah).

#### Prompt Stitch Tahap 2
```text
Enhance the Workload Report by designing a 'What-if Simulation' (Sandbox) Mode.

Include these UI state changes:
- An overt Global State indicator when "Mode Simulasi" is toggled ON (e.g., an orange or dashed-border frame around the content area, or a sticky top banner).
- A floating confirmation bar at the bottom with "Terapkan Perubahan" (Apply) and "Batalkan" (Discard) buttons.
- Design the micro-interaction for redistributing workload: show a distinct 'drag-and-drop' visual state where a manager drags a "Task Block" from an over-allocated user's row (red cell) into a free user's row (gray/green cell).
- Show the visual result: arrows pointing from the old cell to the new cell, with the new cell's color dynamically updating (e.g., turning from green to red if the dragged task makes the new user over-allocated too).
```

---

### C. Best Fit Suggestion (Dropdown & Modal)
**Tujuan layar**
- Desain *smart UI* yang merekomendasikan Assignee tidak hanya berdasarkan daftar abjad, melainkan berdasarkan tingkat *idle*, kelonggaran pada tanggal tugas, dan kesesuaian keahlian (Skill Match). Fitur ini ada di dalam Menu/Form penggarapan Tugas.

**Komponen Dropdown Pintar**
- Ketika klik area "Pilih Assignee" di Task Card/Panel, dropdown yang muncul bukan list biasa.
- Baris nama avatar + badge role.
- Ada tag "Best Fit" atau ikon bintang di urutan pertama.
- Menampilkan mini bar-chart atau teks kecil "Capacity: 60% free this week".

#### Prompt Stitch Tahap 3
```text
Design a Smart 'Best Fit Allocation' Dropdown component to be used inside Task Detail forms.

Instead of a standard list of names, design an advanced Dropdown Popover:
- Top section: A search bar and rapid filter chips (e.g., 'Only Designers', 'Only Available').
- List Items: Display Avatar, Name, and Role.
- Incorporate a "Smart Sort": The top 2-3 users should have a glowing/highlighted tag saying "Best Fit".
- Next to these recommended names, include mini visual indicators of their availability (e.g., a tiny green capacity bar or text saying "Tersedia 20 jam minggu ini").
- Visually separate or gray out users who are Over-allocated (showing a red text warning "Penuh / Red Capacity") or lack the required skill tag.
Make the UI compact, elegant, and highly informative for smart delegation.
```

## 5. Aturan Konsistensi
- Pewarnaan status kapasitas harus selaras antara Heatmap, Bar Chart, dan indikator pada 'Best Fit' dropdown.
- Simulasi/Sandbox Mode *wajib* memberikan perbandingan visual yang kontras agar manajer tidak keliru sedang mengedit data *Live*.

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] Heatmap UI tidak terlihat sesak walau data padat
- [ ] What-If Mode memiliki pembeda visual yang mencolok
- [ ] Dropdown Assignment dirancang dengan konsep *smart suggestion*
