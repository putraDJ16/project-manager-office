# PRD — Meeting Agenda & Personal Calendar

**Status:** Draft  
**Tanggal:** 2026-05-13  
**Author:** Putra Julianto  
**Scope:** Fitur baru — tidak mengubah fitur atau API yang sudah ada.

---

## 1. Latar Belakang

Saat ini aplikasi PMO sudah memiliki manajemen proyek, task, dan isu. Namun belum ada fasilitas untuk menjadwalkan dan mencatat rapat (meeting) di dalam konteks sebuah proyek. Selain itu, user yang terlibat di banyak proyek tidak punya satu tempat untuk melihat semua jadwal meeting mereka secara agregat.

---

## 2. Tujuan

1. Project member dapat membuat, melihat, dan mengelola agenda meeting di dalam setiap proyek.
2. Setiap user yang login dapat membuka **Kalender Personal** yang menampilkan semua meeting dari seluruh proyek yang ia ikuti — dalam tampilan bulan/minggu/hari.

---

## 3. User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-01 | Project member | Membuat jadwal meeting untuk proyek | Tim tahu kapan dan di mana rapat akan berlangsung |
| US-02 | Project member | Melihat daftar semua meeting dalam proyek | Bisa review agenda yang akan datang maupun yang sudah lewat |
| US-03 | Project member | Mengedit detail meeting (waktu, tempat, URL) | Bisa update jadwal jika ada perubahan |
| US-04 | Project member | Menambah/menghapus peserta meeting | Hanya orang yang relevan yang diundang |
| US-05 | Peserta meeting | Merespons undangan (Accept / Decline) | Organizer tahu siapa yang hadir |
| US-06 | Project manager | Menghapus atau membatalkan meeting | Meeting yang tidak jadi tidak mengganggu kalender tim |
| US-07 | Semua user | Membuka Kalender Personal | Melihat semua jadwal meeting dari semua proyek saya dalam satu tampilan |
| US-08 | Semua user | Filter kalender per proyek | Fokus ke proyek tertentu di kalender personal |
| US-09 | Notulen / project member | Menulis catatan meeting (MoM) berisi keputusan, action items, dan ringkasan | Hasil rapat terdokumentasi dan bisa dirujuk kembali |
| US-10 | Notulen / project member | Mengunggah dokumen pendukung meeting (slide, PDF, gambar) | Material rapat tersimpan di satu tempat bersama notulen |
| US-11 | Project member | Membuka halaman ringkasan semua catatan meeting di proyek | Dapat scan semua MoM proyek tanpa membuka satu per satu |
| US-12 | Project member | Mencari catatan meeting berdasarkan kata kunci / tanggal | Cepat menemukan keputusan rapat tertentu |

---

## 4. Fitur & Fungsionalitas

### 4.1 Meeting di Dalam Proyek

Ditempatkan sebagai tab/panel baru **"Meetings"** di dalam halaman `ProjectDetail`.

#### 4.1.1 Daftar Meeting
- Tampilkan semua meeting proyek dalam dua grup: **Mendatang** (upcoming) dan **Selesai/Lewat** (past).
- Kolom: Judul, Tanggal & Waktu, Tipe (Online/Offline), Status, Jumlah Peserta.
- Filter: Status, Rentang Tanggal.

#### 4.1.2 Buat / Edit Meeting
Form dengan field:
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `title` | string | Ya | Nama/judul meeting |
| `description` | string | Tidak | Agenda atau deskripsi rapat |
| `location` | string | Tidak | Nama ruangan / lokasi fisik |
| `meeting_type` | enum | Ya | `Online` atau `Offline` |
| `meeting_url` | string | Tidak | Link Zoom/Meet (aktif jika Online) |
| `start_datetime` | datetime | Ya | Waktu mulai (timezone lokal) |
| `end_datetime` | datetime | Ya | Waktu selesai (harus > start) |
| `attendee_ids` | array int | Tidak | Daftar `employee_id` peserta (pilih dari member proyek) |

#### 4.1.3 Detail Meeting
- Tampilkan semua field di atas.
- Daftar peserta beserta status RSVP (Pending / Accepted / Declined).
- Tombol RSVP untuk user yang login jika ia termasuk peserta.
- Tombol Edit / Hapus / Cancel untuk organizer atau user dengan permission.

#### 4.1.4 Status Meeting
| Status | Keterangan |
|---|---|
| `Scheduled` | Default saat dibuat, jadwal masih mendatang |
| `In Progress` | Waktu sekarang berada di antara start–end |
| `Done` | Waktu end sudah lewat |
| `Cancelled` | Dibatalkan oleh organizer |

Status `In Progress` dan `Done` dapat di-set otomatis berdasarkan waktu, atau diubah manual.

#### 4.1.5 Catatan Meeting (MoM) & Dokumen Pendukung

Setiap meeting punya seksi **"Catatan & Dokumen"** di Modal Detail Meeting.

**Catatan (MoM):**
- Rich text / multi-line text dengan field utama:
  - `summary` — ringkasan singkat hasil rapat (opsional)
  - `notes` — isi notulen lengkap (markdown atau plain text, opsional)
  - `decisions` — daftar keputusan (array of string, opsional)
  - `action_items` — daftar action item dengan `description`, `assignee_employee_id` (opsional), `due_date` (opsional), `is_done` (boolean)
- Satu meeting hanya memiliki **satu** record catatan (1:1). Edit akan mengupdate record yang sama.
- Catatan otomatis menampilkan `last_edited_by` dan `updated_at`.

**Dokumen Pendukung:**
- Upload file dengan validasi: max 20 MB per file, tipe `pdf`, `doc/docx`, `xls/xlsx`, `ppt/pptx`, `png`, `jpg/jpeg`, `txt`.
- Disimpan di storage yang sama dengan project attachments (gunakan kembali `ATTACHMENT_STORAGE_DIR` & pattern di `project_attachment_service.py`).
- Setiap file memiliki: nama asli, ukuran, mime, uploader, deskripsi opsional.
- Aksi: download dan hapus (oleh uploader atau permission `projectMeetings.edit`).

---

### 4.2 Halaman Ringkasan Catatan Meeting (Proyek)

Halaman / panel baru **"Meeting Notes"** di dalam `ProjectDetail` (tab terpisah dari "Meetings"). Tujuannya untuk **scan cepat** semua MoM proyek dalam satu tempat.

#### 4.2.1 Tampilan
- List card kronologis (terbaru di atas) — satu card per meeting yang punya catatan.
- Setiap card menampilkan:
  - Judul meeting + tanggal meeting
  - Ringkasan (`summary`) — truncate jika panjang
  - Jumlah action items (open / total), jumlah dokumen attached
  - Tag warna jika ada action item belum selesai
- Klik card → buka Modal Detail Meeting di tab "Catatan & Dokumen".

#### 4.2.2 Filter & Search
- Search box: cari di `title`, `summary`, `notes`, `decisions`.
- Filter rentang tanggal meeting.
- Filter "Punya action item belum selesai".

---

### 4.3 Kalender Personal

Halaman baru **"Kalender"** di sidebar utama (bukan di dalam proyek). Menampilkan agregat semua meeting dari semua proyek yang diikuti user yang sedang login.

#### 4.3.1 Tampilan Kalender
- **3 mode tampilan:** Bulan (Month), Minggu (Week), Hari (Day).
- Setiap event di kalender menampilkan: Judul meeting, Nama proyek, Warna per-proyek (distinct color).
- Klik event → buka modal ringkasan meeting (title, proyek, waktu, link, status RSVP user).

#### 4.3.2 Filter
- Filter berdasarkan proyek (multi-select dropdown, default: semua proyek).
- Filter berdasarkan status RSVP user (Accepted, Pending, semua).

#### 4.3.3 Navigasi
- Tombol Sebelumnya / Berikutnya / Hari Ini.
- Tampilkan rentang tanggal aktif (misal: "Mei 2026", "12–18 Mei 2026").

---

## 5. Desain Database

### Tabel Baru

#### `project_meetings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `project_id` | integer FK → `projects.id` | Cascade delete |
| `title` | varchar(255) | Judul meeting |
| `description` | text | Nullable |
| `location` | varchar(255) | Nullable |
| `meeting_type` | varchar(20) | `Online` / `Offline` |
| `meeting_url` | varchar(500) | Nullable |
| `start_datetime` | timestamp with time zone | Waktu mulai |
| `end_datetime` | timestamp with time zone | Waktu selesai |
| `status` | varchar(20) | `Scheduled` / `In Progress` / `Done` / `Cancelled` |
| `created_by` | integer FK → `users.id` | Nullable on cascade |
| `created_at` | timestamp | Default now() |
| `updated_at` | timestamp | Default now() |

Constraint: `end_datetime > start_datetime` (enforced di service layer).

#### `project_meeting_attendees`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `meeting_id` | integer FK → `project_meetings.id` | Cascade delete |
| `employee_id` | integer FK → `employees.id` | Cascade delete |
| `rsvp_status` | varchar(20) | `Pending` / `Accepted` / `Declined` |
| `attended` | boolean | Default false; bisa diisi post-meeting |

Primary key: composite (`meeting_id`, `employee_id`).

#### `project_meeting_notes`

Catatan / MoM per meeting (relasi 1:1).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `meeting_id` | integer FK → `project_meetings.id` | Unique, cascade delete |
| `summary` | text | Nullable — ringkasan singkat |
| `notes` | text | Nullable — notulen lengkap (markdown/plain) |
| `decisions` | JSON | Array of string, default `[]` |
| `created_by` | integer FK → `users.id` | Nullable on cascade |
| `last_edited_by` | integer FK → `users.id` | Nullable on cascade |
| `created_at` | timestamp | Default now() |
| `updated_at` | timestamp | Default now(), auto-update |

Constraint: `UNIQUE(meeting_id)` — satu meeting hanya bisa punya satu catatan.

#### `project_meeting_action_items`

Action item terkait MoM. Disimpan terpisah supaya bisa di-query (lookup by assignee, status).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `meeting_note_id` | integer FK → `project_meeting_notes.id` | Cascade delete |
| `description` | varchar(500) | Deskripsi action |
| `assignee_employee_id` | integer FK → `employees.id` | Nullable |
| `due_date` | date | Nullable |
| `is_done` | boolean | Default false |
| `order_index` | integer | Default 0, untuk sortir |

#### `project_meeting_files`

Dokumen pendukung yang diupload pada sebuah meeting. Re-use pola storage `project_attachment_files`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `meeting_id` | integer FK → `project_meetings.id` | Cascade delete |
| `original_name` | varchar(255) | Nama file asli |
| `stored_name` | varchar(255) | Nama file di storage (unique) |
| `mime_type` | varchar(100) | MIME type |
| `size_bytes` | bigint | Ukuran file |
| `description` | varchar(500) | Nullable |
| `uploaded_by` | integer FK → `users.id` | Nullable on cascade |
| `created_at` | timestamp | Default now() |

---

## 6. API Endpoints Baru

Semua endpoint berada di bawah prefix `/api/v1`. Auth JWT wajib untuk semua endpoint.

### 6.1 Meeting per Proyek

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/projects/<project_id>/meetings` | `list_meetings_handler` | `projectMeetings.view` atau project member |
| `POST` | `/projects/<project_id>/meetings` | `create_meeting_handler` | `projectMeetings.create` atau project member |
| `GET` | `/projects/<project_id>/meetings/<meeting_id>` | `get_meeting_handler` | `projectMeetings.view` atau project member |
| `PATCH` | `/projects/<project_id>/meetings/<meeting_id>` | `update_meeting_handler` | `projectMeetings.edit` atau project member |
| `DELETE` | `/projects/<project_id>/meetings/<meeting_id>` | `delete_meeting_handler` | `projectMeetings.delete` atau project member |
| `POST` | `/projects/<project_id>/meetings/<meeting_id>/attendees` | `add_attendees_handler` | `projectMeetings.edit` atau project member |
| `DELETE` | `/projects/<project_id>/meetings/<meeting_id>/attendees/<employee_id>` | `remove_attendee_handler` | `projectMeetings.edit` atau project member |
| `PATCH` | `/projects/<project_id>/meetings/<meeting_id>/attendees/rsvp` | `rsvp_meeting_handler` | Peserta yang login (self-action) |

### 6.2 Catatan Meeting (MoM)

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/projects/<project_id>/meetings/<meeting_id>/note` | `get_meeting_note_handler` | `projectMeetings.view` atau project member |
| `PUT` | `/projects/<project_id>/meetings/<meeting_id>/note` | `upsert_meeting_note_handler` | `projectMeetings.edit` atau project member |
| `DELETE` | `/projects/<project_id>/meetings/<meeting_id>/note` | `delete_meeting_note_handler` | `projectMeetings.delete` atau project member |
| `POST` | `/projects/<project_id>/meetings/<meeting_id>/note/action-items` | `create_action_item_handler` | `projectMeetings.edit` atau project member |
| `PATCH` | `/projects/<project_id>/meetings/<meeting_id>/note/action-items/<item_id>` | `update_action_item_handler` | `projectMeetings.edit` atau project member |
| `DELETE` | `/projects/<project_id>/meetings/<meeting_id>/note/action-items/<item_id>` | `delete_action_item_handler` | `projectMeetings.edit` atau project member |
| `GET` | `/projects/<project_id>/meeting-notes` | `list_project_meeting_notes_handler` | `projectMeetings.view` atau project member |

`PUT /note` bersifat **upsert** — bila belum ada akan create, bila sudah ada akan replace.

`GET /projects/<project_id>/meeting-notes` adalah endpoint khusus untuk halaman summary di proyek. Query params:
- `search` (optional): full-text search di `title`, `summary`, `notes`, `decisions`.
- `start_date` / `end_date` (optional): filter berdasarkan tanggal meeting.
- `has_open_action` (optional, boolean): hanya tampilkan meeting dengan action item belum selesai.

### 6.3 Dokumen Pendukung Meeting

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/projects/<project_id>/meetings/<meeting_id>/files` | `list_meeting_files_handler` | `projectMeetings.view` atau project member |
| `POST` | `/projects/<project_id>/meetings/<meeting_id>/files` | `upload_meeting_file_handler` | `projectMeetings.edit` atau project member |
| `GET` | `/projects/<project_id>/meetings/<meeting_id>/files/<file_id>/download` | `download_meeting_file_handler` | `projectMeetings.view` atau project member |
| `DELETE` | `/projects/<project_id>/meetings/<meeting_id>/files/<file_id>` | `delete_meeting_file_handler` | `projectMeetings.delete`, uploader, atau project member |

Upload menggunakan `multipart/form-data` dengan field `file` (required) dan `description` (optional). Reuse helper validasi/storage dari `project_attachment_service.py`.

### 6.4 Kalender Personal

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/my-calendar` | `my_calendar_handler` | JWT (semua user, hanya proyek milik user) |

Query params `GET /my-calendar`:
- `start_date` (required): ISO date, awal rentang (misal `2026-05-01`)
- `end_date` (required): ISO date, akhir rentang (misal `2026-05-31`)
- `project_ids` (optional): comma-separated int filter

Response shape:
```json
{
  "data": [
    {
      "meeting_id": 1,
      "project_id": 10,
      "project_name": "ERP Migration",
      "title": "Sprint Planning",
      "start_datetime": "2026-05-15T09:00:00+07:00",
      "end_datetime": "2026-05-15T10:00:00+07:00",
      "meeting_type": "Online",
      "meeting_url": "https://meet.example.com/abc",
      "status": "Scheduled",
      "my_rsvp": "Accepted"
    }
  ]
}
```

### 6.5 Request / Response Tipikal

**POST `/projects/<project_id>/meetings`** — Request Body:
```json
{
  "title": "Sprint Review",
  "description": "Review progress sprint 3",
  "location": null,
  "meeting_type": "Online",
  "meeting_url": "https://meet.example.com/sprint3",
  "start_datetime": "2026-05-20T14:00:00+07:00",
  "end_datetime": "2026-05-20T15:00:00+07:00",
  "attendee_ids": [3, 7, 12]
}
```

**PATCH `.../attendees/rsvp`** — Request Body:
```json
{ "rsvp_status": "Accepted" }
```

**PUT `.../meetings/<meeting_id>/note`** — Request Body:
```json
{
  "summary": "Disepakati go-live ditunda 1 minggu.",
  "notes": "Diskusi mendalam tentang...",
  "decisions": [
    "Go-live ditunda ke 27 Mei 2026",
    "Vendor X bertanggung jawab atas migrasi data"
  ],
  "action_items": [
    {
      "description": "Siapkan rencana mitigasi risiko",
      "assignee_employee_id": 7,
      "due_date": "2026-05-18",
      "is_done": false
    }
  ]
}
```

**GET `.../meeting-notes`** — Response (snippet):
```json
{
  "data": [
    {
      "meeting_id": 12,
      "title": "Sprint Review",
      "start_datetime": "2026-05-10T14:00:00+07:00",
      "summary": "Sprint 3 selesai 100%...",
      "decisions_count": 3,
      "action_items_open": 2,
      "action_items_total": 5,
      "files_count": 2,
      "last_edited_by": "Putra J.",
      "updated_at": "2026-05-10T16:30:00+07:00"
    }
  ]
}
```

---

## 7. Permissions Baru

Tambahkan ke sistem permission yang ada di `CODE/be/app/utils/permissions.py` dan setiap `Role` yang relevan:

| Permission Key | Keterangan |
|---|---|
| `projectMeetings.view` | Melihat daftar dan detail meeting proyek |
| `projectMeetings.create` | Membuat meeting baru |
| `projectMeetings.edit` | Mengubah meeting dan mengelola peserta |
| `projectMeetings.delete` | Menghapus meeting |

Project member (tanpa permission eksplisit) tetap dapat view meeting dan melakukan RSVP atas nama dirinya sendiri.

---

## 8. File-File yang Akan Dibuat / Diubah

### Backend (Baru)

| File | Keterangan |
|---|---|
| `CODE/be/app/models/project_meeting.py` | Model `ProjectMeeting` dan `ProjectMeetingAttendee` |
| `CODE/be/app/models/project_meeting_note.py` | Model `ProjectMeetingNote` dan `ProjectMeetingActionItem` |
| `CODE/be/app/models/project_meeting_file.py` | Model `ProjectMeetingFile` |
| `CODE/be/app/services/meeting_service.py` | Business logic: CRUD meeting, validasi waktu, RSVP |
| `CODE/be/app/services/meeting_note_service.py` | Business logic catatan MoM dan action items |
| `CODE/be/app/services/meeting_file_service.py` | Upload/download/delete dokumen meeting (reuse storage util) |
| `CODE/be/app/api/v1/meetings.py` | Flask route handler meeting (thin — delegasi ke service) |
| `CODE/be/app/api/v1/meeting_notes.py` | Flask route handler catatan dan action items |
| `CODE/be/app/api/v1/meeting_files.py` | Flask route handler upload/download dokumen meeting |
| `CODE/be/app/schemas/meeting_schema.py` | Marshmallow schema untuk meeting, note, action item, file |
| `CODE/be/migrations/versions/<hash>_add_project_meetings_tables.py` | Alembic migration (semua tabel meeting) |
| `CODE/be/tests/test_meetings_api.py` | Pytest test endpoint meeting |
| `CODE/be/tests/test_meeting_notes_api.py` | Pytest test endpoint MoM dan action items |
| `CODE/be/tests/test_meeting_files_api.py` | Pytest test upload/download/delete dokumen |

### Backend (Diubah)

| File | Perubahan |
|---|---|
| `CODE/be/app/api/v1/__init__.py` | Daftarkan blueprint meetings |
| `CODE/be/app/utils/permissions.py` | Tambah constant `projectMeetings.*` |

### Frontend (Baru)

| File | Keterangan |
|---|---|
| `CODE/fe/src/app/pages/proyek/ProjectMeetingPanel.tsx` | Panel "Meetings" di dalam ProjectDetail |
| `CODE/fe/src/app/pages/proyek/ProjectMeetingNotesPanel.tsx` | Panel "Meeting Notes" — halaman summary catatan meeting di proyek |
| `CODE/fe/src/app/pages/proyek/MeetingFormModal.tsx` | Modal create/edit meeting |
| `CODE/fe/src/app/pages/proyek/MeetingDetailModal.tsx` | Modal detail meeting (tabs: Info, RSVP, Catatan & Dokumen) |
| `CODE/fe/src/app/pages/proyek/MeetingNoteEditor.tsx` | Komponen editor MoM (summary, notes, decisions, action items) |
| `CODE/fe/src/app/pages/proyek/MeetingFilesPanel.tsx` | Komponen upload/list/download dokumen meeting |
| `CODE/fe/src/app/pages/kalender/MyCalendarPage.tsx` | Halaman kalender personal |
| `CODE/fe/src/app/services/meetingApi.ts` | API client meeting & kalender |
| `CODE/fe/src/app/services/meetingNoteApi.ts` | API client catatan dan action items |
| `CODE/fe/src/app/services/meetingFileApi.ts` | API client upload/download dokumen meeting |
| `CODE/fe/src/app/domain/meetings.ts` | Domain types: `Meeting`, `MeetingAttendee`, `RsvpStatus`, `MeetingStatus`, `MeetingNote`, `MeetingActionItem`, `MeetingFile` |

### Frontend (Diubah)

| File | Perubahan |
|---|---|
| `CODE/fe/src/app/pages/proyek/ProjectDetail.tsx` | Tambah tab "Meetings" dan "Meeting Notes" |
| `CODE/fe/src/app/routes.ts` | Tambah route `/kalender` → `MyCalendarPage` |
| `CODE/fe/src/app/components/layout/AppShell.tsx` | Tambah item "Kalender" di sidebar navigasi |

---

## 9. Pertimbangan UX

- **Color coding proyek** di kalender: gunakan palet warna deterministic (misal hash `project_id` ke HSL), disimpan sebagai konstanta di domain layer.
- **Kalender library:** Gunakan library ringan yang kompatibel dengan Tailwind. Opsi: `react-big-calendar` (dengan adapter date-fns) atau implementasi custom grid sederhana untuk menghindari dependency berat. Perlu verifikasi di `package.json` sebelum implementasi.
- **Timezone:** Simpan semua datetime di backend dalam UTC. Frontend konversi ke timezone lokal browser menggunakan `Intl.DateTimeFormat`.
- **Conflict detection (opsional v2):** Tampilkan warning di form jika peserta sudah punya meeting yang bentrok di waktu yang sama.

---

## 10. Pertimbangan Teknis

- Validasi `end_datetime > start_datetime` dilakukan di `meeting_service.py` dan raise `ApiError(400)`.
- Endpoint `GET /my-calendar` mengambil hanya meeting dari proyek yang user-nya terdaftar sebagai `project_member`, sehingga isolasi data terjamin tanpa logic permission tambahan.
- RSVP handler memvalidasi bahwa `current_user.employee_id` ada di `project_meeting_attendees` sebelum mengizinkan update.
- Cascade delete: saat proyek dihapus, semua meeting → catatan → action items → dokumen ikut terhapus via foreign key cascade.
- Upload dokumen meeting **reuse** util storage dari `project_attachment_service.py` (folder dasar `ATTACHMENT_STORAGE_DIR`, sub-folder per proyek). Tidak duplikasi kode validasi MIME/size.
- `PUT /note` bersifat upsert untuk menyederhanakan client logic (frontend tidak perlu cek dulu apakah catatan sudah ada).
- Search di `GET /meeting-notes` menggunakan `ILIKE` PostgreSQL pada kolom text (sederhana untuk v1; bisa di-upgrade ke full-text search di v2).

---

## 11. Out of Scope (Versi Pertama)

- Integrasi Google Calendar / Outlook.
- Notifikasi email / push ke peserta meeting.
- Recurring / repeating meeting.
- Conflict detection otomatis antar peserta.
- Rich text editor lengkap (WYSIWYG) untuk MoM — v1 cukup textarea dengan dukungan markdown render.
- Versi/riwayat edit catatan (audit trail per edit catatan).
- Action item terhubung otomatis ke modul Task.

---

## 12. Update Dokumen AI Context yang Diperlukan

Setelah implementasi selesai, wajib update:

| Dokumen | Update yang Diperlukan |
|---|---|
| `docs/ai-context/feature-map.md` | Tambah baris fitur **Meeting Agenda**, **Meeting Notes (MoM)**, dan **Personal Calendar** |
| `docs/ai-context/api-map.md` | Tambah semua endpoint baru (meeting, attendee, RSVP, note, action item, file, my-calendar) |
| `docs/ai-context/database.md` | Tambah baris `project_meetings`, `project_meeting_attendees`, `project_meeting_notes`, `project_meeting_action_items`, `project_meeting_files` |

---

## 13. Kriteria Penerimaan (Acceptance Criteria)

| ID | Kriteria | Cara Verifikasi |
|---|---|---|
| AC-01 | Project member bisa membuat meeting dengan semua field wajib | POST meeting berhasil, `201` response |
| AC-02 | Validasi gagal jika `end_datetime ≤ start_datetime` | POST meeting, dapat `400` dengan pesan error |
| AC-03 | Daftar meeting tampil dan terfilter dengan benar di frontend | Buka tab Meetings di ProjectDetail |
| AC-04 | Peserta dapat RSVP Accept/Decline | PATCH rsvp, status berubah di detail meeting |
| AC-05 | Kalender personal hanya tampilkan meeting proyek user yang login | Login 2 user berbeda, kalender berbeda |
| AC-06 | Filter proyek di kalender berfungsi | Centang/uncentang proyek, event hilang/muncul |
| AC-07 | Semua endpoint baru dilindungi JWT | Request tanpa token mendapat `401` |
| AC-08 | Semua endpoint permission-aware | User tanpa `projectMeetings.view` mendapat `403` |
| AC-09 | Project member dapat menulis & menyimpan catatan MoM (summary, notes, decisions) | `PUT /note` berhasil, response berisi data tersimpan |
| AC-10 | Action item bisa di-create, update (toggle is_done), dan delete | POST/PATCH/DELETE action item, perubahan persist |
| AC-11 | Upload dokumen meeting menolak file > 20MB atau MIME tidak didukung | Upload file invalid → `400` dengan pesan jelas |
| AC-12 | Download dokumen meeting berhasil dan hanya untuk project member | `200` untuk member, `403` untuk non-member |
| AC-13 | Halaman summary catatan meeting menampilkan card kronologis dengan jumlah action item open/total | Buka tab "Meeting Notes" di ProjectDetail |
| AC-14 | Search di summary catatan menemukan match pada title/summary/notes/decisions | Ketik kata kunci, list ter-filter |
| AC-15 | Pytest backend baru lulus semua kasus | `pytest CODE/be/tests/test_meetings_api.py CODE/be/tests/test_meeting_notes_api.py CODE/be/tests/test_meeting_files_api.py` hijau |
| AC-16 | `npm run build` frontend berhasil tanpa error TypeScript | Build output bersih |
