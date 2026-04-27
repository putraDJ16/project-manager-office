
# Kustomisasi Data dan Tata Letak (Custom Fields & Layout Builder)

## 1. Tujuan Menu
Modul admin untuk memperluas struktur data (Tugas, Isu, Proyek) dan merancang secara visual bagaimana *form* dan rincian data ditampilkan (Forms & Detail panel).

## 2. Pengguna Utama
System Administrator, Project Admin.

## 3. Urutan Eksekusi di Stitch
Berfokus pada manajemen *data mapping* dan tata letak *grid builder*.
1. Buat **Pembuatan Custom Fields (Tipe Data)**
2. Lanjutkan ke **Layout Builder (Kanvas Drag-and-Drop Struktur)**
3. Lanjutkan ke **Layout Rules (Conditional Visibility / Preview)**

## 4. Detail Desain per Halaman

### A. Konfigurasi Custom Fields
**Tujuan layar**
- Merancang tempat (kolom/properti) baru untuk jenis data unik yang berbeda tiap tim, serta daftarnya.

**Struktur Layout**
- *List View*: Tabel daftar field kustom beserta lokasinya (Modul Tugas, Isu) dan tipe algoritmanya.
- *Modal Buat Form: Tipe Data Screen*: Layout grid atau list dengan ikon visual mewakili setiap jenis input data (Teks, Dropdown, Checkbox, Tanggal, Mata Uang, User Lookup).
- *Modal Buat Form: Properti Detail*: Nama kolom, set default value, tooltip instruksi, set mandatory toggle.

#### Prompt Stitch Tahap 1
```text
Design the 'Custom Fields Manager' UI for the Administration module.

Include:
- A clean list/table page showing active custom fields (Columns: Nama Field, Tipe Data, Modul Pengguna, Mandatory).
- A two-step "Create New Field" Modal Flow:
  - Step 1 (Type Selection): A visually distinct grid of card buttons representing Data Types (Single-Line Text, Multi-Line, Number, Date, Picklist/Dropdown, Checkbox, URL, Assignee Lookup). Use clear iconography for each.
  - Step 2 (Configuration): A form capturing 'Label Name', 'Tooltip/Help Text', 'Default Value', and a toggle for 'Wajib Diisi' (Mandatory). If 'Picklist' was chosen, include an inline dynamic input list to add dropdown options.
Ensure the administrative UI remains consistent with the modern, bright PM SaaS design principles.
```

---

### B. Layout Builder (Drag-and-Drop Canvas)
**Tujuan layar**
- Menyusun letak koordinat properti tambahan di dalam halaman Form Buat baru maupun Detail Tugas (sehingga Admin bisa menata urutan informasi).

**Struktur Layout**
- Sidebar Katalog Kiri/Kanan: Kumpulan "Standard Fields" (Title, Desc, Assignee) & "Custom Fields".
- Area Utama (Tengah): Pratinjau Kanvas Form. Terdiri dari Section (Grup Header). Dalam satu Section bisa mensupport 1 kolom penuh atau 2 kolom berdampingan.
- Interaksi: Tarik elemen dari sidebar ke dalam outline *drop zone* pada kanvas. Menggeser elemen untuk menukar posisi teks.

#### Prompt Stitch Tahap 2
```text
Design the 'Task/Form Layout Builder' workspace page.

Include a drag-and-drop structural canvas workspace:
- A Sidebar Panel outlining a "Field Library" categorized into 'Standard Fields' and 'Custom Fields', formatted as draggable pill/block items.
- The Main Canvas Area acting as a live preview of the Task Form/Detail panel. Show structured "Sections" with title headers (e.g., 'Informasi Utama', 'Spesifikasi Teknis').
- Support 1-column (full width) and 2-column (side-by-side) drop zones within sections.
- Display the visual micro-interaction of dragging a field block: a ghost element following the cursor and a dashed highlight box demonstrating where the dropped field will land in the layout.
- Indicate "Read-Only" or "Locked" system fields with a small padlock icon so organizers know they cannot be deleted.
```

---

### C. Layout Rules (Conditional Visibility Form)
**Tujuan layar**
- Merancang logika untuk menyingkirkan *clutter* pada UI pengguna. Field tertentu hanya muncul jika ada *trigger* khusus (Misal: Field 'Alasan Pembatalan' muncul HANYA jika status = 'Cancel').

**Struktur Layout**
- Builder baris Aturan: JIKA (Kondisi Field A) MAKA TAMPILKAN/SEMBUNYIKAN (Field B).
- Interaksi Pratinjau (Preview Form): Tampilan Form end-user di mana pengguna memilih sebuah dropdown (Misal Type 'Design'), lalu animasi *expand/smooth fade-in* memunculkan field baru di bawahnya 'Desain Resolusi' dan 'Tautan Figma'.

#### Prompt Stitch Tahap 3
```text
Design the 'Conditional Layout Rules' Setup and its resulting Live Preview interaction.

Design a split layout or two side-by-side views illustrating the concept:
1) The Setup Screen: An "IF-THEN" logic builder focused strictly on UI visibility. E.g., Condition: [Tipe Tugas] equals [Desain]; Action dropdowns: [Tampilkan] field [Link Figma] AND [Jadikan Wajib Disi] field [Tanggal Review].
2) The End-User Form Preview (Live Interaction Concept): Show a polished Task Form simulating the user experience. Illustrate the 'Conditional Reveal' interaction: as a user selects 'Desain' from a main dropdown, show a smooth animated transition (e.g., fade-in and slide-down) where the new 'Link Figma' input field elegantly materializes inline without breaking the form's flow.
```

## 5. Aturan Konsistensi
- Pastikan area Kanvas di Layout Builder memiliki skala rasio yang merepresentasikan halaman form/detail sesungguhnya (WYSIWYG layout).
- Gunakan bahasa yang deskriptif dan non-teknis agar gampang dikonfigurasi admin bisnis.

## 6. Checklist Sebelum Lanjut ke Menu Berikutnya
- [ ] Pilihan Data Types memiliki ikon yang membedakan dengan cepat.
- [ ] Drop space/grid 1-column dan 2-column pada builder layout terlihat rapi.
- [ ] Konsep Conditional Visibility dapat dimengerti dari pratinjau yang disajikan.
