
# Otomatisasi Alur Kerja (Workflows & Business Rules)

## 1. Tujuan Menu
Modul bagi Admin/Manajer sistem untuk mendesain prosedur standar (SOP) secara digital, membuat urutan transisi status (Blueprint), serta pemicu kejadian otomatis berdasar kondisi tertentu (Business Rules).

## 2. Pengguna Utama
Project Admin, Workflow Manager, System Administrator.

## 3. Urutan Eksekusi di Stitch
Area ini paling kompleks secara logika, melibatkan antarmuka *builder/canvas*.
1. Buat **Visual Blueprint Builder (State Machine Canvas)**
2. Lanjutkan ke **Blueprint Execution pada End-User**
3. Lanjutkan ke **Transition Validation (Before/During/After)**
4. Tutup dengan **Business Rules (If-Then Logic Configuration)**

## 4. Detail Desain per Halaman

### A. Visual Blueprint Builder (Drag-and-Drop Canvas)
**Tujuan layar**
- Merangkai *flowchart* yang menentukan arah status (misal: dari Open > In Progress > Review > Done).

**Struktur Layout**
- Sidebar Kiri: *Toolbox* (Daftar Status yang bisa diseret ke kanvas).
- Area Utama: Kanvas kotak-kotak (grid canvas) interaktif. Layar besar.
- Komponen *Node*: Melambangkan **State/Status**.
- Komponen *Connector*: Garis berpanah melambangkan **Transition/Action**.

#### Prompt Stitch Tahap 1
```text
Design a Visual Blueprint Flow Builder (Drag-and-Drop Canvas) for shaping automated task statuses.

Include:
- A Left/Right Sidebar Toolbox containing draggable elements like "Status Nodes" (Open, In Progress, Review, Done).
- The Main Canvas Area featuring a subtle dot-grid or light grid background for alignment.
- Status Nodes placed on the canvas: clean rectangular boxes showing the Status Name and Color Badge. Include hover states showing connection anchor points.
- Transition Connectors: Curved or orthogonal arrowed lines connecting one Status Node to another. The connectors act as buttons/labels (e.g., text 'Submit for Review' positioned on the arrow line) signifying the action the user must take.
- A top action bar with "Zoom In/Out", "Auto-Layout", and "Simpan Blueprint".
Keep the diagram builder looking like a modern enterprise SaaS tool (e.g., similar to Figma or linear workflows), not an overly technical legacy IDE.
```

---

### B. Blueprint Execution (Sisi Pengguna Akhir)
**Tujuan layar**
- Menunjukkan bagaimana pengaturan dari layar Builder berinteraksi dengan pengguna biasa saat membuka *Task Panel*.

**Komponen UI (di Panel Detail Tugas)**
- Jika Blueprint aktif, pengguna *tidak bisa* merubah status secara bebas via tombol dropdown biasa.
- Tombol dropdown status diganti dengan Tombol Transisi Dinamis yang panjang dan jelas. Misalnya: tombol bertuliskan "Kirim untuk Review".
- Di atasnya terdapat "Blueprint Progress Tracker" atau *Stepper* mini yang menunjukkan posisi tugas di alur yang lebih besar.

#### Prompt Stitch Tahap 2
```text
Design the End-User experience of a Blueprint Execution inside the Task Detail Side Panel.

Focus strictly on the top portion of the Task Detail Drawer:
- Instead of a traditional Status dropdown, display an active Blueprint state.
- Show a horizontal "Progress Stepper" or Tracker at the top indicating the flow (Open -> [In Progress] -> Review -> Done), with the current node highlighted.
- Highlight dynamic "Transition Action Buttons". For example, if the current status is 'In Progress', show a bright, prominent primary button labeled "Kirim untuk Review" (Submit for Review) and perhaps a secondary "Tunda" (Hold) button, explicitly governed by the blueprint logic.
Ensure it is utterly clear to the end-user what specific action is required to move the task forward.
```

---

### C. Transition Settings (Before/During/After Validation)
**Tujuan layar**
- Panel untuk menyetel apa yang harus terjadi dan validasi apa yang harus dipenuhi sebelum garis *Connector/Transition* bisa dilalui.

**Struktur Layout (Panel Konfigurasi Transisi)**
- Saat sebuah garis transisi diklik (di builder), Sidebar Kanan muncul.
- Berisi 3 Tabs Logika Terpandu:
  - **Before (Syarat):** Siapa role yang boleh memencet tombol ini?
  - **During (Validasi/Mandatory):** Pesan Form Pop-up apa yang harus dilengkapi? (Misal: wajib isi field "Github Link", wajib upload "Bukti File").
  - **After (Automasi):** Action otomatis apa yang jalan? (Updated field waktu pencapaian, kirim email).

#### Prompt Stitch Tahap 3
```text
Design the Transition Configuration Side Panel and the End-User Validation Pop-up.

Show two views:
1) Setup Panel (for Admin): A right-side properties panel displaying three tabs: "Before" (Condition/Permissions), "During" (Mandatory Fields prompt setup), and "After" (Automated Actions). In the "During" tab, show an interface for selecting which task fields (e.g., 'Github Commit URL') become mandatory.
2) Execution Pop-up (for End-User): A clean Modal Prompt that suddenly appears when the user clicks a transition button (like "Submit to Review"). The modal must display the mandatory input fields the Admin configured (e.g., asking for the Github URL or an Uploaded File) before allowing the status change to finalize.
Ensure the layout is highly structured, breaking down complex logic into easy-to-read segments.
```

---

### D. Business Rules (If-Then Builder) & Automated Actions
**Tujuan layar**
- Tempat merancang Macro/Rule berdasar "Trigger" apa saja (di luar alur Blueprint).

**Struktur Layout (If-Then Rule Builder)**
- Format list vertikal (Criteria builder).
- Header: Nama Rule.
- Blok **Kapan (Trigger)**: Misal "Saat Tugas Dibuat".
- Blok **Syarat (If)**: Pilihan bersusun - Field [Prioritas] + Operator [Sama Dengan] + Value [Critical].
- Blok **Aksi (Then)**: Tombol "+ Tambah Aksi" -> Pilihan: Update Field, Send Email Alert, Trigger Webhook.
  - Untuk *Email Alerts*: sediakan text editor pop-up dengan variabel *merge tag* seperti `${Task_Name}`.

#### Prompt Stitch Tahap 4
```text
Design the 'Business Rules & Automated Actions' logic builder page.

Include a highly readable vertical IF-THEN interface:
- Trigger Block: A dropdown selector e.g., "Kapan aturan ini dijalankan?" (When Task is Created/Updated).
- Condition Block (IF): A row-based query builder allowing combinations: Field Selector (Dropdown) + Operator (Equals/Contains) + Value Input. Support adding multiple "AND/OR" rows.
- Action Block (THEN): An area showing sequence of actions (e.g., 'Update Field: Priority -> High' and 'Send Email Alert').
- Display a modal over this screen showing the "Email Notification Setup": A simple rich-text composer supporting dynamic tags (represented visually as pills, e.g., `${Assignee_Name}`).
Focus heavily on typography, spacing, and clear container borders so complex logic statements read naturally like sentences.
```

## 5. Aturan Konsistensi
- Gunakan ikon yang seragam untuk mewakili *Role*, *Field Types* (Teks, Angka, Tanggal), dan aksi sistem (Email, Webhook).
- Jauhkan kesan "Coding". Semua *logic builder* harus dirancang sedekat mungkin ke bahasa manusia (No-Code approach).

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] Kanvas Blueprint punya visual yang *clean* dan intuitif ala diagram modern.
- [ ] Transisi dari Blueprint memiliki pemaknaan tombol yang eksplisit di sisi *Task Detail*.
- [ ] Form Input Bersyarat (If/Then) mudah dipindai tanpa merusak tata letak saat *nesting* memanjang.
