
# Global Home Dashboard

## Tujuan
Dashboard utama dipakai sebagai landing page atau tampilan perdana bagi Manager / Anggota Tim saat membuka aplikasi. Area ini berfokus menampilkan metriks krusial kesehatan proyek dan prioritas personal.

## KPI yang Disarankan
- Tugas Aktif Hari Ini (Prioritas Personal)
- Tugas Overdue (Global / Proyek terpilih)
- Isu/Bug Terbuka & Eskalasi (Severity Tinggi)
- Sprint Berjalan (Batas Waktu Sprint)
- Ringkasan Beban Kerja (Burnout Alert / Under-utilization)
- Persentase Anggaran Terpakai (Burn-rate global)

## Komponen Utama
- salam personal dan filter scope global (Semua Proyek vs Proyek Tertentu)
- deretan KPI cards ringkas di atas
- **Chart 1:** Workload Heatmap mini atau Grafik Burn-down Sprint
- **Chart 2:** Status Tugas & Bug (Pie chart To-do vs Progress vs Done vs Bug)
- **Panel Utama:** My Priorities (Task milik user dengan urutan deadline & SLA terdekat)
- **Panel Sekunder:** Activity Feed (Log aktivitas tim terbaru secara real-time)
- quick links / universal add floating button

## Layout
- header dengan sapaan, tanggal, & global project / sprint selector
- baris 1: KPI cards (4-6 kotak, menggunakan indikator tren naik/turun)
- baris 2 (split kolom): Grafik Burn-down / Progress (kiri) & Workload / Resource Health (Kanan)
- baris 3 (split kolom): Tabel My Priorities (kiri - porsi lebih lebar) & Activity Feed/Reminders (kanan)

## State Utama
- Jika user adalah **Manajer**: Prioritas menampilkan status proyek, kesehatan biaya (EVM), peringatan kapasitas tim, dan ringkasan report.
- Jika user adalah **Anggota Tim (Individu)**: Prioritas menampilkan daftar "Tugasku Hari Ini", waktu yang tercatat dalam timer, notifikasi bug, reminder deadline pribadi.
*(Pada prompt, asumsikan view manager/PMO untuk menunjukkan kompleksitas, dengan panel My Task untuk personal).*

## Prompt Stitch
```text
Design the multi-role home dashboard for a desktop-first enterprise project management platform (PM SaaS) in Indonesian language.
The page is the landing area right after login, delivering a global snapshot of projects, team health, sprint progress, and individual priorities.

Include:
- a greeting header with today's date and a global "Project/Scope Selector" dropdown.
- top KPI cards: Tugas Aktif, Tugas Overdue, Open Bugs (Eskalasi), Sprint Days Left, Budget Burn-rate, Team Capacity Health. Include trend arrows.
- two main visual charts: a Sprint Burn-down chart (or Task Progress bar chart) and a mini Team Workload Heatmap or Capacity Gauge.
- a wide "My Priorities" / "Tindak Lanjut Mendesak" table section listing overdue tasks, high severity bugs, and upcoming deadlines assigned to the user.
- a responsive right or side panel containing a real-time "Activity Feed" and automated "Reminders".
- clean, modern, bright interface with indigo/violet accents against white backgrounds, keeping data dense but actionable.
- floating Global Timer widget and Universal Add button visible in the layout context.

Ensure the visual weight guides the eye towards red flags (overdue, critical bugs, over-budget) immediately.
```

## Checklist
- [ ] View terasa seperti 'Command Center' proyek
- [ ] Pembedaan jelas antara data personal (Tugasku) dan data aggregate (Kesehatan Proyek/Tim)
- [ ] Area peringatan (red flags) sangat mudah dipindai
- [ ] Ruang dimanfaatkan secara efisien (high density) tanpa terlihat kacau
