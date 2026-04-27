# **Modul Manajemen Tugas**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan daftar fitur manajemen tugas dan struktur kerja yang diminta. Tugas ini dibagi menjadi beberapa *Epic* agar proses desain lebih terstruktur.

## **1\. Struktur & Hierarki Proyek (Project Structure)**

*Fokus pada bagaimana pengguna melihat dan mengatur kerangka besar proyek.*

### **Task 1.1: Desain Tampilan Work Breakdown Structure (WBS)**

* **Deskripsi:** Merancang antarmuka untuk menampilkan proyek dalam unit struktural secara hierarkis.  
* **To-Do List:**  
  * Buat wireframe/UI untuk *Tree View* atau *List View* yang mendukung indentasi bertingkat.  
  * Desain interaksi *expand/collapse* (buka/tutup) pada setiap level WBS.  
  * Buat state desain: *Empty state* (belum ada WBS), *Hover state*, dan *Selected state*.  
* **Deliverable:** Mockup WBS View.

### **Task 1.2: Desain Komponen Milestones**

* **Deskripsi:** Merancang visualisasi untuk pencapaian utama (fase makro).  
* **To-Do List:**  
  * Desain *Milestone Card* atau visual pada *Timeline/Gantt Chart*.  
  * Buat UI untuk modal *Create/Edit Milestone* (input: Nama, Tanggal Mulai, Tenggat Waktu, Penanggung Jawab).  
  * Sertakan *progress bar* pada milestone untuk melihat persentase penyelesaian.  
* **Deliverable:** Mockup Milestone View & Form Milestone.

### **Task 1.3: Desain Pengelompokan Task Lists**

* **Deskripsi:** Merancang kontainer untuk mengkategorikan tugas secara tematik (misal: "Desain UI", "Pengembangan API").  
* **To-Do List:**  
  * Desain UI *Header* untuk Task List (termasuk judul, jumlah tugas di dalamnya, dan tombol tambah tugas).  
  * Desain opsi tampilan: bentuk *List Vertikal* dan *Board/Kanban Kolom*.  
* **Deliverable:** Mockup Task List Container (List & Board view).

## **2\. Manajemen Tugas Inti (Core Task Management)**

*Fokus pada pembuatan dan pengelolaan unit kerja esensial.*

### **Task 2.1: Desain UI Tasks (Tugas Utama)**

* **Deskripsi:** Merancang tampilan unit kerja esensial dengan parameter waktu dan prioritas.  
* **To-Do List:**  
  * Desain *Task Row/Card* (menampilkan Judul, Assignee, Due Date, Prioritas, Status).  
  * Desain *Task Detail Panel* (terbuka saat task diklik: berisi deskripsi lengkap, kolom komentar, lampiran file, dan riwayat aktivitas).  
  * Desain label/badge untuk Prioritas (Rendah, Sedang, Tinggi, Kritis).  
* **Deliverable:** Mockup Task Card & Panel Detail Task.

### **Task 2.2: Desain Hierarki Subtasks**

* **Deskripsi:** Merancang dekonstruksi tugas yang kompleks menjadi bagian yang lebih kecil di dalam *Task Utama*.  
* **To-Do List:**  
  * Desain area Subtask di dalam *Task Detail Panel*.  
  * Buat interaksi penambahan subtask secara cepat (inline editing).  
  * Desain indikator visual pada *Task Card* di tampilan luar yang menunjukkan jumlah subtask (misal: "2/5 selesai").  
* **Deliverable:** Mockup UI Subtasks Section.

## **3\. Agregasi Data & Aksesibilitas**

*Fokus pada efisiensi navigasi dan visualisasi kemajuan.*

### **Task 3.1: Desain Roll-up Summaries**

* **Deskripsi:** Merancang indikator rekapitulasi data agregat kemajuan dari level subtask hingga ke milestone/proyek.  
* **To-Do List:**  
  * Desain komponen persentase (Donut chart kecil atau Progress Bar).  
  * Terapkan desain ini pada level Task Utama (berdasarkan Subtask), Task List (berdasarkan Task), dan Milestone (berdasarkan Task List).  
  * Pastikan perubahan warna sesuai status (misal: merah jika *overdue*, hijau jika *completed*).  
* **Deliverable:** UI Components untuk Progress/Roll-up Summary.

### **Task 3.2: Desain Universal Add (Quick Action)**

* **Deskripsi:** Merancang tombol aksi cepat untuk menambahkan elemen dari mana saja di dalam aplikasi.  
* **To-Do List:**  
  * Desain *Floating Action Button (FAB)* atau tombol \+ pada Top Navigation Bar.  
  * Desain *Dropdown/Menu Popover* saat tombol diklik (Opsi: Tambah Profil, Tambah Tugas, Catat Bug, Tambah Dokumen).  
  * Desain modal form singkat (*Quick Create*) untuk masing-masing entitas tersebut.  
* **Deliverable:** Mockup Universal Add button & interaksi popover-nya.

## **4\. Otomatisasi & Peringatan (Automation & Alerts)**

*Fokus pada pengingat tenggat waktu dan tugas berulang.*

### **Task 4.1: Desain Konfigurasi Recurrence (Tugas Berulang)**

* **Deskripsi:** Merancang UI untuk mengatur otomatisasi tugas rutin berbasis interval.  
* **To-Do List:**  
  * Desain tombol/ikon *Repeat/Recurrence* di dalam form pembuatan Tugas.  
  * Desain *Pop-up/Modal Settings* untuk Recurrence (Pilihan: Harian, Mingguan, Bulanan, Custom hari).  
  * Desain penanda visual (ikon *loop*) pada Task Card untuk menandakan itu adalah tugas berulang.  
* **Deliverable:** Mockup Recurrence Settings UI & indikator task berulang.

### **Task 4.2: Desain Sistem Reminders (Pengingat)**

* **Deskripsi:** Merancang UI untuk peringatan sistematis sebelum tenggat waktu.  
* **To-Do List:**  
  * Desain pengaturan reminder di dalam detail Task (misal: dropdown "Ingatkan saya: 1 hari sebelum, 1 jam sebelum").  
  * Desain *Notification Center* (Ikon Lonceng) dan *Dropdown List* notifikasi di navigasi atas.  
  * Desain *Toast Notification* (pop-up kecil) jika reminder muncul saat user sedang membuka aplikasi.  
* **Deliverable:** Mockup Reminder Settings & Notification UI.

## **5\. Dukungan Agile (Agile Methodology)**

*Fokus pada manajemen siklus sprint untuk tim software development.*

### **Task 5.1: Desain Modul Sprints**

* **Deskripsi:** Merancang ruang kerja untuk kerangka kerja Scrum/Agile.  
* **To-Do List:**  
  * Desain tampilan *Backlog* (daftar tugas yang belum masuk sprint).  
  * Desain tampilan *Active Sprint Board* (Kanban board dengan kolom To-do, In Progress, Done).  
  * Desain form *Start Sprint* (Target sprint, tanggal mulai/selesai).  
  * Desain UI *Sprint Retrospective* (kolom untuk input hal yang berjalan baik, hal yang perlu ditingkatkan, dll).  
* **Deliverable:** Mockup Backlog View, Active Sprint Board, dan halaman Retrospective.

### **Catatan untuk Tim Desain:**

* **Design System:** Pastikan untuk membuat atau menggunakan komponen standar (Tombol, Input Text, Dropdown, Modal) agar desain tetap konsisten di seluruh modul.  
* **Responsive:** Setiap desain perlu mempertimbangkan tampilan pada layar Desktop (minimal 1024px) dan Mobile/Tablet.

# **Modul Manajemen Isu dan Bug**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur manajemen isu dan bug yang diminta. Tugas ini dibagi menjadi beberapa *Epic* dengan mempertahankan struktur agar proses pengerjaan tim desain tetap konsisten dan terarah.

## **6\. Pencatatan & Pelacakan Isu (Issue Tracking)**

*Fokus pada bagaimana pengguna melaporkan, melihat, dan mengelola daftar kerusakan atau bug.*

### **Task 6.1: Desain Form Pelaporan Isu/Bug**

* **Deskripsi:** Merancang antarmuka untuk mencatat kerusakan beserta detail teknisnya.  
* **To-Do List:**  
  * Buat UI form pelaporan dengan input standar (Judul, Deskripsi, Langkah Reproduksi, Assignee).  
  * Desain komponen *Dropdown* atau *Radio Button* untuk klasifikasi Tingkat Keparahan (Severity: Blocker, Critical, Major, Minor, Trivial).  
  * Sediakan area *Drag & Drop* untuk mengunggah lampiran (screenshot/video error).  
* **Deliverable:** Mockup Form Create/Report Issue.

### **Task 6.2: Desain Tampilan Daftar Isu (Issue List/Board)**

* **Deskripsi:** Merancang halaman utama untuk melihat semua isu yang sedang dilacak.  
* **To-Do List:**  
  * Desain tampilan *List View* (tabel) dan *Kanban Board* khusus untuk bug tracking.  
  * Buat komponen Filter & Sorting lanjutan (berdasarkan tingkat keparahan, status penyelesaian, pelapor, dan modul yang terdampak).  
  * Desain *badge* warna-warni untuk membedakan tingkat keparahan dengan cepat.  
* **Deliverable:** Mockup halaman Issue List & Kanban Board untuk Bug.

### **Task 6.3: Desain Detail Panel Isu**

* **Deskripsi:** Merancang tampilan halaman atau panel detail dari satu isu/bug tertentu.  
* **To-Do List:**  
  * Desain tata letak yang memisahkan area deskripsi utama dengan log aktivitas/komentar.  
  * Buat UI untuk mengubah status bug secara cepat (misal: *Open* \-\> *In Progress* \-\> *Resolved* \-\> *Closed*).  
* **Deliverable:** Mockup Issue Detail Panel.

## **7\. Service Level Agreements (SLA)**

*Fokus pada perhitungan dan visualisasi tenggat waktu perbaikan berdasarkan kebijakan layanan.*

### **Task 7.1: Desain UI Pengaturan Kebijakan SLA**

* **Deskripsi:** Merancang halaman bagi admin/manajer proyek untuk mengatur aturan kalkulasi otomatis tenggat waktu.  
* **To-Do List:**  
  * Desain tabel pengaturan matriks SLA (Misal: Baris \= Severity, Kolom \= Waktu Respon, Waktu Penyelesaian).  
  * Buat form modal untuk menambah atau mengedit aturan SLA kustom.  
* **Deliverable:** Mockup Halaman SLA Settings.

### **Task 7.2: Desain Indikator Visual SLA pada Isu**

* **Deskripsi:** Merancang elemen visual agar tim tahu sisa waktu perbaikan sebelum melanggar SLA.  
* **To-Do List:**  
  * Desain *Countdown Timer* (waktu mundur) atau label status (misal: "2 jam tersisa", "SLA Terlewati") untuk diletakkan di dalam *Issue Card* dan *Detail Panel*.  
  * Terapkan pewarnaan dinamis (misal: Hijau \= Aman, Kuning \= Mendekati tenggat, Merah \= SLA breached).  
* **Deliverable:** UI Components untuk indikator SLA.

## **8\. Sistem Eskalasi Otomatis**

*Fokus pada peringatan proaktif dan pengalihan tugas jika isu tidak teratasi sesuai waktu SLA.*

### **Task 8.1: Desain Konfigurasi Aturan Eskalasi**

* **Deskripsi:** Merancang antarmuka untuk menentukan tindakan apa yang terjadi jika SLA terlewati.  
* **To-Do List:**  
  * Desain UI *Rule Builder* sederhana (Logika *If-This-Then-That*). Contoh: "JIKA SLA Blocker terlewati, MAKA assign ke \[Project Manager\] dan kirim email".  
  * Sediakan komponen *Dropdown* untuk memilih target eskalasi (user atau role tertentu).  
* **Deliverable:** Mockup UI Escalation Rule Settings.

### **Task 8.2: Desain Peringatan & Notifikasi Eskalasi**

* **Deskripsi:** Merancang notifikasi visual yang menonjol untuk isu yang telah dieskalasi.  
* **To-Do List:**  
  * Desain label atau ikon khusus (seperti peringatan tanda seru atau api) pada bug yang berstatus *Escalated*.  
  * Desain template *In-app Notification* dan *Email Alert* yang dikirimkan secara otomatis kepada pihak eskalasi.  
* **Deliverable:** Mockup Escalated Issue Badges & Escalation Alerts.

### **Catatan untuk Tim Desain:**

* **Design System:** Pastikan komponen seperti form, tombol, dan *dropdown* menggunakan standar yang sama dengan Modul Manajemen Tugas sebelumnya agar tetap konsisten.  
* **Warna Status & Severity:** Karena ini berhubungan dengan bug dan SLA, pertimbangkan palet warna yang cukup kontras (terutama untuk error/bahaya) dan pastikan ramah bagi penderita buta warna (aksesibilitas).  
* **Responsive:** Setiap desain perlu mempertimbangkan tampilan pada layar Desktop (minimal 1024px) dan Mobile/Tablet.

# **Modul Visualisasi dan Navigasi Proyek**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur visualisasi dan navigasi proyek. Tugas ini dibagi menjadi beberapa *Epic* agar pengerjaannya terstruktur, berfokus pada bagaimana pengguna berinteraksi dengan data dan jadwal proyek.

## **9\. Visualisasi Garis Waktu & Jadwal (Timeline & Scheduling)**

*Fokus pada tampilan berbasis kalender dan manajemen waktu.*

### **Task 9.1: Desain Gantt Charts Interaktif**

* **Deskripsi:** Merancang pemetaan garis waktu proyek dengan dukungan manipulasi data secara langsung.  
* **To-Do List:**  
  * Desain antarmuka kalender horizontal (Timeline Grid) yang dapat di-*zoom in/out* (skala hari, minggu, bulan).  
  * Buat komponen *Task Bar* yang mendukung interaksi *drag-and-drop* (menggeser jadwal) dan *resize* (memperpanjang/memperpendek durasi).  
  * Desain garis penghubung (konektor panah) untuk menunjukkan dependensi/ketergantungan antar tugas.  
  * Buat UI *Tooltip* atau *Pop-over* ringkas saat pengguna melakukan *hover* pada *Task Bar*.  
* **Deliverable:** Mockup UI Gantt Chart & Interaksi Drag-and-drop.

### **Task 9.2: Visualisasi Critical Path Method (Jalur Kritis)**

* **Deskripsi:** Merancang elemen visual untuk mengidentifikasi rantai kegiatan esensial yang tidak boleh terlambat.  
* **To-Do List:**  
  * Sediakan desain *Toggle Switch* atau tombol "Highlight Critical Path" di area *toolbar* Gantt Chart.  
  * Desain *state* khusus (misalnya, warna merah tebal atau *glow effect*) pada *Task Bar* dan garis dependensi yang termasuk dalam jalur kritis.  
* **Deliverable:** Mockup *state* Gantt Chart dengan Critical Path aktif.

### **Task 9.3: Desain Project Baselines (Rencana vs Aktual)**

* **Deskripsi:** Merancang visualisasi untuk membandingkan jadwal rencana awal dengan realisasi aktual di lapangan.  
* **To-Do List:**  
  * Desain komponen "Baseline Bar" (biasanya berupa bar tipis/abu-abu) yang berada tepat di bawah atau berdampingan dengan *Task Bar* aktual.  
  * Buat indikator visual jika terjadi keterlambatan (misal: area *delay* diberi warna khusus atau tanda peringatan).  
  * Desain *Tooltip* perbandingan data (menampilkan "Rencana: \[Tanggal\] vs Aktual: \[Tanggal\]").  
* **Deliverable:** UI Components untuk perbandingan Baseline di Gantt Chart.

## **10\. Tampilan Alur Kerja & Matriks Data**

*Fokus pada pengelolaan tugas operasional harian dan analisis data padat.*

### **Task 10.1: Desain Kanban Boards**

* **Deskripsi:** Merancang visualisasi alur kerja harian melalui kartu virtual berdasarkan status.  
* **To-Do List:**  
  * Desain struktur kolom *Board* (To-Do, In Progress, In Review, Done) yang lebarnya adaptif.  
  * Desain *Task Card* khusus versi Kanban yang padat namun informatif (Judul, Assignee, Label, Jumlah Subtask, Ikon Komentar/Attachment).  
  * Buat interaksi visual saat kartu ditarik (*dragged state*) dan area penempatan (*drop zone highlight*).  
  * (Opsional) Desain *Swimlanes* atau pengelompokan baris horizontal berdasarkan assignee atau prioritas.  
* **Deliverable:** Mockup Kanban Board & Interaksi drag-and-drop kartu.

### **Task 10.2: Desain Classic & Plain Views (List/Table Matrix)**

* **Deskripsi:** Merancang tampilan matriks data padat untuk keperluan analisis dan laporan cepat.  
* **To-Do List:**  
  * Desain antarmuka mirip *spreadsheet* (tabel data) dengan kepadatan tinggi (*high density*).  
  * Buat fitur interaktif pada tabel: *Resize* lebar kolom, *Show/Hide* kolom, dan pengurutan (*Sorting*).  
  * Desain interaksi *Bulk Action* (Checkbox untuk memilih banyak baris tugas sekaligus, diikuti menu *floating* untuk edit/hapus massal).  
  * Sediakan *Sticky Header* agar nama kolom tetap terlihat saat pengguna melakukan *scroll* ke bawah.  
* **Deliverable:** Mockup Tabel Data Padat (Classic View) & UI Bulk Action.

### **Catatan untuk Tim Desain:**

* **Interaktivitas Ekstra:** Karena modul ini sangat mengandalkan *drag-and-drop*, pastikan Anda memberikan pedoman *micro-interaction* yang jelas (seperti *cursor style*, bayangan elemen saat ditarik, dan animasi *snap*).  
* **Kepadatan Data (Data Density):** Berikan opsi (bila perlu) kepada pengguna untuk mengubah tingkat kepadatan baris (misal: *Comfortable, Standard, Compact*) khususnya pada Classic View.  
* **Navigasi View:** Sediakan *View Switcher* (Dropdown atau Tabs) di bagian atas layar agar pengguna mudah berpindah dari Gantt, Kanban, atau Classic view tanpa memuat ulang seluruh halaman.

# **Modul Manajemen Sumber Daya Manusia**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur Manajemen Sumber Daya Manusia (Resource Management). Tugas ini dikategorikan ke dalam beberapa *Epic* dengan fokus utama pada visualisasi kapasitas tim, mekanisme penugasan cerdas, serta simulasi skenario beban kerja.

## **11\. Laporan Beban Kerja (Workload Reports)**

*Fokus pada visualisasi kapasitas dan utilitas setiap anggota tim untuk mencegah burnout atau under-utilization.*

### **Task 11.1: Desain Grafik Bar View Beban Kerja**

* **Deskripsi:** Merancang antarmuka visualisasi beban kerja menggunakan diagram batang untuk memantau alokasi waktu atau tugas secara harian maupun mingguan.  
* **To-Do List:**  
  * Desain grafik batang horizontal/vertikal (Sumbu X: Waktu, Sumbu Y: Jumlah Jam/Tugas per Anggota).  
  * Terapkan skema warna status kapasitas: *Under-allocated* (Biru/Abu-abu), *Optimal* (Hijau), dan *Over-allocated* (Merah).  
  * Desain interaksi *hover state* pada batang grafik untuk menampilkan detail tugas pada hari tersebut.  
* **Deliverable:** Mockup Bar View Workload Report.

### **Task 11.2: Desain Heatmap View Beban Kerja**

* **Deskripsi:** Merancang matriks kepadatan data (*Heatmap*) untuk pemantauan kapasitas tim secara menyeluruh dalam satu tampilan.  
* **To-Do List:**  
  * Desain tabel matriks (Baris: Nama Anggota Tim, Kolom: Tanggal/Minggu).  
  * Buat gradasi warna dinamis sel berdasarkan intensitas beban (hijau muda untuk ketersediaan penuh hingga merah gelap untuk *over-capacity*).  
  * Desain filter penyortiran anggota berdasarkan departemen atau spesialisasi peran.  
* **Deliverable:** Mockup Heatmap View Workload Report.

## **12\. Alokasi Penugasan (Best Fit Allocation)**

*Fokus pada optimalisasi pemilihan personel yang paling sesuai untuk setiap unit tugas.*

### **Task 12.1: Desain Antarmuka "Best Fit Suggestion"**

* **Deskripsi:** Merancang antarmuka yang memberikan rekomendasi anggota tim secara cerdas berdasarkan kompetensi (skill) dan ketersediaan waktu.  
* **To-Do List:**  
  * Desain *dropdown* atau *modal* pencarian "Assignee" pada form pengelolaan tugas.  
  * Tampilkan *badge* spesialisasi/kompetensi di samping identitas anggota tim.  
  * Buat indikator visual tingkat kecocokan atau status "Available/Busy" dalam *dropdown list*.  
  * Desain fitur *Smart Sort* untuk menempatkan kandidat dengan kecocokan tertinggi di urutan teratas.  
* **Deliverable:** Mockup Assignee Dropdown dengan Best Fit UI.

## **13\. Perencanaan & Simulasi (What-if Simulation)**

*Fokus pada perancangan skenario distribusi beban kerja dalam lingkungan sandbox sebelum implementasi aktual.*

### **Task 13.1: Desain Mode "Simulasi" (Sandbox Mode)**

* **Deskripsi:** Merancang lingkungan aman (*Sandbox Mode*) bagi manajer untuk menguji dampak perubahan jadwal tanpa memengaruhi data produksi asli.  
* **To-Do List:**  
  * Desain *Toggle Switch* (misal: "Enable What-if Mode") pada halaman Workload Reports.  
  * Buat perubahan visual *global state* (seperti *border* warna khusus atau *watermark*) sebagai indikator aktifnya mode simulasi.  
  * Sediakan tombol aksi untuk "Apply Changes" atau "Discard" skenario simulasi.  
* **Deliverable:** Mockup UI What-if Simulation Mode (Global State).

### **Task 13.2: Desain Interaksi Drag-and-Drop Skenario**

* **Deskripsi:** Merancang interaksi seret-dan-lepas untuk redistribusi beban kerja antar anggota tim di dalam mode simulasi.  
* **To-Do List:**  
  * Desain interaksi penarikan (*drag*) blok tugas antar personel pada tampilan *Bar* atau *Heatmap*.  
  * Buat animasi transisi *real-time update* yang menunjukkan perubahan warna kapasitas secara instan saat tugas dipindahkan.  
* **Deliverable:** UI Flow / Mockup interaksi Drag-and-Drop pada mode simulasi.

### **Catatan untuk Tim Desain:**

* **Penggunaan Warna:** Modul ini sangat bergantung pada indikator warna. Pastikan status *Over-allocated* ditampilkan dengan kontras yang kuat agar manajer dapat segera mengidentifikasi risiko.  
* **State Management:** Dalam *What-if Mode*, perbedaan antara draf simulasi yang belum disimpan dengan data *aktual* harus sangat kontras secara visual.

# **Modul Otomatisasi Alur Kerja**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur Otomatisasi Alur Kerja (Blueprints) dan Business Rules. Tugas ini dibagi menjadi beberapa *Epic* dengan fokus pada perancangan alur logika, validasi data, dan otomatisasi aksi.

## **14\. Visualisasi & Builder Blueprint (Blueprint Engine)**

*Fokus pada perancangan antarmuka bagi Admin/Manajer untuk membuat peta alur status kerja prosedural.*

### **Task 14.1: Desain Blueprint Flow Builder (Drag-and-Drop Canvas)**

* **Deskripsi:** Merancang area kanvas interaktif untuk menyusun "Status" dan "Transisi".  
* **To-Do List:**  
  * Desain *node* grafis untuk merepresentasikan **Status** (misal: *Open, In Progress, Review, Closed*).  
  * Desain panah konektor interaktif untuk merepresentasikan **Transisi** (jalur dari satu status ke status lain).  
  * Sediakan *Sidebar Toolbox* yang berisi elemen-elemen yang bisa ditarik (*drag-and-drop*) ke dalam kanvas.  
* **Deliverable:** Mockup UI Visual Blueprint Builder.

### **Task 14.2: Desain Eksekusi Blueprint pada Sisi Pengguna (End-User)**

* **Deskripsi:** Merancang bagaimana transisi Blueprint ini ditampilkan dan digunakan oleh anggota tim saat mengerjakan tugas/isu.  
* **To-Do List:**  
  * Desain tombol transisi dinamis pada *Task/Bug Detail Panel*. (Catatan: Dropdown status biasa dikunci/dihilangkan, diganti dengan tombol aksi sesuai transisi yang tersedia di titik tersebut, misal tombol "Mulai Kerjakan" atau "Kirim untuk Review").  
  * Buat indikator visual (seperti *stepper* atau *progress tracker*) yang menunjukkan posisi status saat ini dalam keseluruhan alur Blueprint.  
* **Deliverable:** UI Tombol Transisi dinamis & Indikator Progress pada panel detail tugas.

## **15\. Validasi Prasyarat & Mandatory Fields**

*Fokus pada mekanisme untuk memastikan data lengkap sebelum tugas bisa berpindah ke status berikutnya.*

### **Task 15.1: Desain Pengaturan Transisi (Transition Settings)**

* **Deskripsi:** Merancang panel bagi Admin untuk mengatur prasyarat di dalam garis *Transisi*.  
* **To-Do List:**  
  * Desain panel properti transisi dengan tiga tab logika: **Before** (Syarat siapa yang bisa klik), **During** (Data apa yang wajib diisi), dan **After** (Aksi otomatis apa yang terjadi).  
  * Pada tab *During*, desain UI untuk menambahkan *Mandatory Fields* (misal: memilih field "Bukti Screenshot", "Waktu Pengerjaan", atau "Alasan Eskalasi" sebagai kolom wajib isi).  
* **Deliverable:** Mockup Panel Konfigurasi Transisi (Before, During, After).

### **Task 15.2: Desain Pop-up Validasi Transisi (Prompt for End-User)**

* **Deskripsi:** Merancang UI yang muncul ketika pengguna mengklik tombol transisi, meminta mereka mengisi *Mandatory Fields*.  
* **To-Do List:**  
  * Desain *Modal/Pop-up Form* yang muncul seketika setelah tombol transisi diklik.  
  * Tampilkan kolom isian data (seperti text input, file upload, dropdown) sesuai dengan *Mandatory Fields* yang disetel Admin.  
  * Sediakan tombol *Submit* yang akan mengubah status jika validasi terpenuhi, atau memunculkan *error state* jika ada field wajib yang terlewat.  
* **Deliverable:** Mockup Modal Prompt Mandatory Fields.

## **16\. Eksekusi Otomatis & Business Rules**

*Fokus pada pemicu otomatis untuk komunikasi sistem, manipulasi variabel, dan integrasi pasca-transisi.*

### **Task 16.1: Desain Konfigurasi Eksekusi Otomatis (Automated Actions)**

* **Deskripsi:** Merancang UI untuk mengatur aksi mesin setelah suatu kondisi atau transisi terpenuhi (bagian *After* pada transisi).  
* **To-Do List:**  
  * Desain UI *Action Selector* (Pilihan: Email Alerts, Field Update, Custom Functions, Webhooks).  
  * **Email Alerts:** Desain pop-up editor template email sederhana dengan dukungan penambahan *variabel dinamis* (misal: "Halo ${Assignee\_Name}").  
  * **Webhooks & Custom Functions:** Desain form untuk memasukkan URL Webhook, *Header*, *Payload/Body* JSON, dan editor teks baris kode (*code snippet editor*) untuk Custom Functions.  
* **Deliverable:** Mockup UI Settings untuk Email Alerts, Webhooks, & Custom Functions.

### **Task 16.2: Desain Builder Workflow & Business Rules Khusus Bug**

* **Deskripsi:** Merancang halaman sentral untuk membuat aturan bisnis mandiri yang dapat memanipulasi variabel secara otomatis di luar Blueprint.  
* **To-Do List:**  
  * Desain daftar (*List View*) dari *Business Rules* yang sudah dibuat, lengkap dengan tombol *Toggle* aktif/non-aktif.  
  * Desain pembuat aturan dengan logika **If-Then** berbasis form bersusun. (Contoh UI: JIKA \[Severity\] \= \[Critical\], MAKA \[Update Field 'Priority'\] menjadi \[High\]).  
* **Deliverable:** Mockup Halaman Manajemen Business Rules & If-Then Builder.

### **Catatan untuk Tim Desain:**

* **Kompleksitas vs Usability:** Fitur Blueprint dan Workflow Builder (Epic 1 & 3\) ditujukan untuk *Admin/Manager*, namun hindari tampilan yang terlalu mirip aplikasi pembuat kode (IDE). Gunakan bahasa antarmuka (UX writing) yang awam dan visual yang intuitif.  
* **Konsistensi UI:** Komponen *node*, *connector/arrow*, dan modal pop-up harus mengikuti *Design System* utama "Stitch" yang telah dirancang di modul-modul sebelumnya.

# **Modul Kustomisasi Data dan Tata Letak**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur Kustomisasi Data dan Tata Letak. Tugas ini dibagi menjadi beberapa *Epic* dengan fokus pada fleksibilitas pembuatan kolom data khusus, penyusunan form, dan aturan kondisional antarmuka pengguna.

## **17\. Manajemen Field Kustom (Custom Fields Engine)**

*Fokus pada perancangan sistem bagi Admin untuk membuat dan mengelola berbagai macam tipe data tambahan di luar standar bawaan aplikasi.*

### **Task 17.1: Desain Form Pembuatan "Custom Fields"**

* **Deskripsi:** Merancang UI untuk membuat properti/kolom data baru dengan berbagai tipe format.  
* **To-Do List:**  
  * Desain langkah pemilihan *Tipe Data* dengan ikon visual (Pilihan: *Single-Line Text, Multi-Line, Pick List/Dropdown, Date, Number, Checkbox, User Selection*).  
  * Desain form konfigurasi detail berdasarkan tipe data yang dipilih (Misal: Jika memilih *Pick List*, muncul area untuk menginput opsi-opsi *dropdown*).  
  * Buat opsi konfigurasi tambahan (*toggle*): Jadikan *Mandatory* (wajib isi) atau tampilkan *Default Value*.  
* **Deliverable:** Mockup Modal/Halaman Pembuatan Custom Fields.

### **Task 17.2: Desain Library Custom Fields (Daftar Kolom)**

* **Deskripsi:** Merancang halaman sentral untuk melihat semua *custom fields* yang pernah dibuat dalam sistem.  
* **To-Do List:**  
  * Desain *Data Table* yang menampilkan Nama Field, Tipe Data, Modul yang Menggunakan (Tugas/Isu/Proyek), dan Aksi (Edit/Hapus).  
  * Sediakan kolom pencarian dan filter berdasarkan tipe data untuk memudahkan manajemen.  
* **Deliverable:** Mockup Halaman Daftar Custom Fields.

## **18\. Perancangan Tata Letak (Layouts Builder)**

*Fokus pada pembuatan struktur antarmuka form/tugas yang dapat disesuaikan untuk berbagai kebutuhan industri atau tim spesifik.*

### **Task 18.1: Desain Layout Builder berbasis Drag-and-Drop**

* **Deskripsi:** Merancang kanvas visual interaktif tempat Admin dapat menyusun urutan dan posisi *fields* di dalam form pembuatan Tugas/Isu.  
* **To-Do List:**  
  * Desain *Sidebar Toolbox* di sebelah kiri/kanan yang berisi daftar *Standard Fields* dan *Custom Fields*.  
  * Desain area kanvas di tengah yang merepresentasikan form (mendukung format 1 kolom atau 2 kolom sejajar).  
  * Buat interaksi seret-dan-lepas (*drag-and-drop*) untuk memindahkan field dari *toolbox* ke kanvas, atau mengubah urutan field di dalam kanvas.  
  * Sediakan fitur "Tambah Seksi" (*Add Section*) untuk mengelompokkan field di bawah judul tertentu (misal: Seksi "Informasi Klien", Seksi "Detail Teknis").  
* **Deliverable:** Mockup UI Drag-and-Drop Layout Builder.

### **Task 18.2: Desain Pengelolaan Layouts & Penugasan**

* **Deskripsi:** Merancang UI untuk mengelola daftar *Layout* yang telah dibuat dan memetakan layout tersebut ke proyek atau peran tertentu.  
* **To-Do List:**  
  * Desain kartu/daftar *Layout* (Misal: "Software Bug Layout", "Content Creation Layout").  
  * Buat form untuk menetapkan *Layout Assignment* (Menentukan layout A digunakan oleh Proyek X atau Departemen Y).  
* **Deliverable:** Mockup Halaman Manajemen Layouts & Assignment Form.

## **19\. Aturan Kondisional Antarmuka (Task Layout Rules)**

*Fokus pada pengaturan visibilitas field secara dinamis untuk menyederhanakan tampilan form berdasarkan input pengguna (If-Then Logic).*

### **Task 19.1: Desain Builder "Layout Rules"**

* **Deskripsi:** Merancang UI bagi Admin untuk membuat logika bersyarat terkait kapan suatu field muncul, disembunyikan, atau menjadi wajib diisi.  
* **To-Do List:**  
  * Desain antarmuka pembuatan *Rule* (Aturan) yang mudah dibaca.  
  * **Kondisi (IF):** Desain *dropdown* bersusun untuk memilih *trigger* (Misal: JIKA field 'Tipe Pekerjaan' \= 'Desain').  
  * **Aksi (THEN):** Desain pilihan aksi (Misal: MAKA 'Tampilkan' field 'Tautan Figma', DAN 'Jadikan Wajib' field 'Tenggat Waktu').  
* **Deliverable:** Mockup Halaman Konfigurasi Task Layout Rules.

### **Task 19.2: Desain Interaksi End-User (Conditional Visibility Preview)**

* **Deskripsi:** Mendefinisikan animasi dan interaksi yang terjadi pada sisi pengguna saat sebuah aturan (*rule*) aktif di dalam form.  
* **To-Do List:**  
  * Desain efek transisi yang mulus (*smooth expand/fade-in*) ketika sebuah field baru tiba-tiba muncul di form akibat pengguna memilih opsi tertentu.  
  * Buat *state design* untuk form yang masih terkunci sebagian sebelum prasyarat terpenuhi.  
* **Deliverable:** UI Flow & Panduan Animasi untuk kemunculan dinamis *Conditional Fields*.

### **Catatan untuk Tim Desain:**

* **Pratinjau Langsung (Live Preview):** Khusus untuk Epic 2 (Layout Builder), usahakan area kanvas tengah benar-benar mencerminkan tampilan asli form agar Admin tidak perlu bolak-balik menekan tombol *preview*.  
* **Status "Read-Only":** Perlu diingat bahwa tidak semua field bisa dihapus (misal: Judul Tugas adalah *Standard Field* yang sifatnya permanen). Beri indikator visual (seperti ikon gembok) untuk field bawaan sistem pada saat proses *drag-and-drop*.  
* **Aksesibilitas & Hirarki Visual:** Saat mendesain builder dengan banyak logika *If-Then*, gunakan indentasi dan *spacing* yang cukup agar aturan yang kompleks tetap nyaman dibaca oleh mata manusia.

# **Modul Waktu dan Akuntansi Finansial**

Berikut adalah rincian tugas desain (UI/UX) berdasarkan fitur Waktu dan Akuntansi Finansial. Tugas ini dibagi menjadi beberapa *Epic* dengan fokus pada pelacakan jam kerja, manajemen anggaran, dan visualisasi kesehatan proyek tingkat lanjut (EVM).

## **20\. Pelacakan Waktu & Timesheet (Time Tracking)**

*Fokus pada pencatatan waktu kerja baik secara otomatis maupun manual, beserta alur persetujuannya.*

### **Task 20.1: Desain UI Timer Otomatis (Global Timer)**

* **Deskripsi:** Merancang antarmuka *stopwatch/timer* yang mudah diakses dari mana saja tanpa mengganggu navigasi utama.  
* **To-Do List:**  
  * Desain *Floating Widget* atau panel kecil di *Top Navigation Bar* untuk Timer.  
  * Sediakan tombol kontrol yang jelas: *Start, Pause, Stop/Log*.  
  * Buat form ringkas (*dropdown* atau pop-up mini) saat *timer* dimulai untuk mengaitkan waktu tersebut dengan tugas (*Task*) atau proyek tertentu.  
  * Desain *state* aktif: Timer berkedip lembut atau berjalan saat disembunyikan/di-minimize.  
* **Deliverable:** Mockup Global Timer Widget & interaksinya.

### **Task 20.2: Desain Timesheet Manual & Alur Persetujuan**

* **Deskripsi:** Merancang tampilan *grid/kalender* bagi anggota tim untuk mengisi log waktu, dan bagi manajer untuk menyetujuinya.  
* **To-Do List:**  
  * Desain *Weekly Timesheet View* (Tabel dengan Baris \= Nama Tugas, Kolom \= Hari dalam seminggu) untuk input jam kerja manual.  
  * Buat antarmuka *Approval Dashboard* untuk Manajer (Daftar *timesheet* yang menunggu persetujuan).  
  * Sediakan tombol aksi *Approve* (Setujui) dan *Reject* (Tolak dengan catatan) secara individual maupun massal (*bulk action*).  
* **Deliverable:** Mockup Halaman Timesheet (User View) & Dasbor Persetujuan (Manager View).

## **21\. Prakiraan & Pemantauan Anggaran (Budget Forecasting)**

*Fokus pada visualisasi biaya proyek dan pembandingan antara anggaran yang direncanakan dengan realisasi biaya aktual.*

### **Task 21.1: Desain Form Pengaturan Anggaran**

* **Deskripsi:** Merancang UI untuk menetapkan *budget* awal proyek dan tarif sumber daya.  
* **To-Do List:**  
  * Desain form *Project Budget Setup* (Pilihan tipe anggaran: *Berdasarkan Jam, Berdasarkan Jumlah Uang, atau Fixed Cost*).  
  * Desain tabel pengaturan *Billing Rates* (Tarif per jam) untuk setiap anggota tim atau peran (misal: Designer \= Rp150.000/jam).  
* **Deliverable:** Mockup Form Setup Anggaran & Tarif.

### **Task 21.2: Desain Visualisasi Planned vs. Actual Cost**

* **Deskripsi:** Merancang grafik pemantauan pengeluaran secara real-time.  
* **To-Do List:**  
  * Desain komponen *Budget Progress Bar* (menampilkan persentase anggaran yang sudah terpakai).  
  * Buat grafik garis/area (*Burn-down/Burn-up chart*) yang membandingkan garis *Planned Cost* (Estimasi) dengan *Actual Cost* (Realita dari Timesheet/Pengeluaran).  
  * Desain indikator peringatan warna (Hijau \= Sesuai budget, Kuning \= Mendekati batas, Merah \= *Overbudget*).  
* **Deliverable:** Mockup Budget Dashboard & Progress Indicators.

## **22\. Earned Value Management (EVM)**

*Fokus pada penyajian metrik kompleks analisis kesehatan proyek menjadi visual yang mudah dipahami oleh pemangku kepentingan.*

### **Task 22.1: Desain Dasbor Parameter Utama EVM**

* **Deskripsi:** Merancang area untuk menampilkan nilai absolut dari metrik EVM: *Planned Value (PV), Earned Value (EV),* dan *Actual Cost (AC)*.  
* **To-Do List:**  
  * Desain *Scorecards/Widget Cards* di bagian atas dasbor untuk menampilkan angka PV, EV, dan AC secara bersisian dengan tipografi yang jelas.  
  * Berikan *Tooltip* kecil ikon (i) di sebelah setiap metrik yang menjelaskan apa arti singkatan tersebut secara awam jika di-hover.  
  * Desain *Trend Graph* (grafik garis gabungan) untuk melihat pergerakan ketiga metrik ini dari waktu ke waktu.  
* **Deliverable:** Mockup EVM Scorecards & Trend Graph.

### **Task 22.2: Desain Indikator Kesehatan Proyek (SPI & CPI)**

* **Deskripsi:** Merancang visualisasi untuk indeks performa jadwal dan biaya.  
* **To-Do List:**  
  * Desain visualisasi berupa *Gauge Dial* (seperti spidometer) atau grafik *Donut* untuk **SPI** (*Schedule Performance Index*) dan **CPI** (*Cost Performance Index*).  
  * Atur pewarnaan yang intuitif pada *Gauge*:  
    * Angka \> 1.0 (Hijau / Sangat Baik / Mendahului jadwal & Lebih hemat).  
    * Angka \= 1.0 (Biru / Sesuai target).  
    * Angka \< 1.0 (Merah / Peringatan / Terlambat & Rugi).  
  * Sediakan ringkasan teks otomatis di bawah grafik (Misal: "Proyek ini berjalan 15% lebih lambat dari jadwal, namun menghemat biaya 5%").  
* **Deliverable:** Mockup UI Gauge Dial SPI/CPI & Auto-Summary Text.

### **Catatan untuk Tim Desain:**

* **Kejelasan Data (Data Clarity):** Fitur finansial sangat sensitif. Pastikan pemisah ribuan/desimal pada mata uang terlihat sangat jelas dan konsisten (misal: Rp 1.500.000,00).  
* **Aksesibilitas Informasi:** Istilah EVM (PV, EV, AC, SPI, CPI) sangat teknis. Pendekatan UX yang baik adalah selalu menyediakan *tooltip* atau teks bantuan ringkas agar manajer yang bukan spesialis PMO tetap dapat membaca dasbor tersebut tanpa kebingungan.  
* **Warna Status Keuangan:** Gunakan standar warna akuntansi jika memungkinkan (Merah untuk defisit/negatif/overbudget, Hijau/Hitam untuk surplus/positif).

