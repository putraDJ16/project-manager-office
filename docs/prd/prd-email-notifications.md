# PRD — Email Notifications

**Status:** Draft
**Tanggal:** 2026-05-16
**Author:** Putra Julianto
**Scope:** Fitur baru — menambah kanal email di samping notifikasi in-app yang sudah ada. Tidak mengubah perilaku API publik yang sudah ada.

---

## 1. Latar Belakang

Saat ini sistem PMO hanya memiliki notifikasi **in-app** (lihat [docs/ai-context/features/notifications.md](../ai-context/features/notifications.md)). User baru tahu ada penugasan/perubahan ketika ia membuka aplikasi dan melihat badge unread. Untuk event yang time-sensitive (undangan meeting, eskalasi isu, penugasan task) ini terlambat.

Email notification dibutuhkan agar:
1. User mendapat informasi penting walau sedang tidak membuka aplikasi.
2. Undangan meeting bisa dilihat di inbox dan ditambahkan ke kalender pribadi (Gmail/Outlook).
3. Penugasan project/task/issue terdokumentasi di email (audit trail informal).

PRD sebelumnya ([prd-meeting-agenda-calendar.md](./prd-meeting-agenda-calendar.md) §11) sudah menyebut notifikasi email sebagai *out of scope versi pertama* — PRD ini mengisinya.

---

## 2. Tujuan

1. Semua event yang saat ini memicu in-app notification juga memicu email ke target user yang sama.
2. Menambah event meeting (undangan, update, cancel, reminder) sebagai event email-only baru.
3. Sistem pengiriman email reliable (retry, logging), aman (kredensial via env), dan tidak memblokir request API user.

### Non-Tujuan

- Tidak membangun newsletter / marketing email.
- Tidak membangun template builder UI.
- Tidak membangun digest harian/mingguan di v1 (lihat §12).

---

## 3. Inventaris Event — Apa yang Perlu Dikirim ke Email

Hasil pemetaan repo:

### 3.A Event yang Sudah Memicu In-App Notification (Wajib Diperluas ke Email)

| # | Event | Pemicu (file:line) | Target | Subjek Email |
|---|---|---|---|---|
| E-01 | Manager project ditetapkan saat create project | [project_service.py:186](../../CODE/be/app/services/project_service.py#L186) | Manager baru | "Anda ditetapkan sebagai Project Manager: {project.name}" |
| E-02 | Manager project diganti via update | [project_service.py:234](../../CODE/be/app/services/project_service.py#L234), [project_service.py:249](../../CODE/be/app/services/project_service.py#L249) | Manager baru | Sama dengan E-01 |
| E-03 | Anggota baru ditambahkan ke project | [project_service.py:324](../../CODE/be/app/services/project_service.py#L324) | Anggota baru | "Anda ditambahkan ke project: {project.name}" |
| E-04 | Task baru ditugaskan | [task_service.py:143](../../CODE/be/app/services/task_service.py#L143) | Assignee | "Tugas baru: {task.title}" |
| E-05 | Issue baru ditugaskan | [issue_service.py:54](../../CODE/be/app/services/issue_service.py#L54) | Assignee | "Isu baru ditugaskan: {issue.title}" |

### 3.B Event Baru yang Perlu Ditambahkan (Meeting & SLA)

Saat ini belum ada notifikasi sama sekali untuk event berikut. Email = kanal pertama.

| # | Event | Sumber data | Target | Subjek Email |
|---|---|---|---|---|
| E-06 | Undangan meeting (saat POST `/meetings` atau saat attendee baru ditambahkan) | `project_meetings`, `project_meeting_attendees` | Setiap attendee | "Undangan rapat: {meeting.title} — {start}" |
| E-07 | Meeting di-reschedule (start/end/url/location berubah) | PATCH `/meetings/<id>` | Semua attendee | "Perubahan jadwal rapat: {meeting.title}" |
| E-08 | Meeting dibatalkan (status → Cancelled atau DELETE) | PATCH/DELETE `/meetings/<id>` | Semua attendee | "Rapat dibatalkan: {meeting.title}" |
| E-09 | Reminder H-1 (24 jam sebelum start) | Scheduler harian | Setiap attendee non-Declined | "Pengingat rapat besok: {meeting.title}" |
| E-10 | Reminder T-30m (30 menit sebelum start, opsional v1.1) | Scheduler 5-menitan | Setiap attendee non-Declined | "Rapat akan dimulai 30 menit lagi" |
| E-11 | Action item meeting ditugaskan | POST/PATCH `/note/action-items` | Assignee action item | "Action item baru dari rapat: {meeting.title}" |
| E-12 | Issue di-escalate | POST `/issues/<id>/escalate` | Reporter + assignee | "Isu di-escalate: {issue.title}" |
| E-13 | Issue mendekati / melewati SLA deadline | Scheduler harian, baca `sla_config` | Assignee + manager | "SLA hampir habis: {issue.title}" |

### 3.C Event Auth / Akun

| # | Event | Sumber | Target | Subjek Email |
|---|---|---|---|---|
| E-14 | Employee baru dibuat (welcome email berisi default password) | `employee_service.create_employee` | Email employee baru | "Akun PMO Anda sudah aktif" |
| E-15 | Password di-reset oleh admin | `employee_service.reset_employee_password` ([api-map.md](../ai-context/api-map.md) baris 50) | Email employee | "Password Anda telah direset" |
| E-16 | User mengganti password sendiri | POST `/auth/change-password` | Email user | "Konfirmasi: password berhasil diubah" |

### 3.D Ringkasan Prioritas Implementasi

| Fase | Event |
|---|---|
| **v1 (MVP)** | E-01..E-05 (paritas dengan in-app), E-06, E-07, E-08, E-14, E-15, E-16 |
| **v1.1** | E-09 reminder H-1, E-11 action item, E-12 escalation |
| **v2** | E-10 reminder T-30m, E-13 SLA breach, digest harian |

---

## 4. User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-01 | Project member | Menerima email saat ditambahkan ke project | Saya langsung tahu walau sedang tidak login |
| US-02 | Assignee task/isu | Menerima email saat ditugaskan | Tahu langsung dari notifikasi HP |
| US-03 | Attendee meeting | Menerima undangan email berisi tanggal, waktu, link, lokasi | Bisa add to calendar saya (Gmail/Outlook) |
| US-04 | Attendee meeting | Menerima email perubahan / pembatalan jadwal | Tidak datang sia-sia |
| US-05 | Attendee meeting | Menerima reminder H-1 | Tidak lupa rapat |
| US-06 | Employee baru | Menerima welcome email berisi cara login | Bisa langsung akses akun |
| US-07 | User | Menerima konfirmasi setelah ganti / reset password | Sebagai bukti dan early-warning kalau bukan saya |
| US-08 | User | Mengatur preferensi email (opt-out per kategori) | Tidak terganggu jika sudah cukup dengan in-app |
| US-09 | Admin | Melihat log pengiriman email (success/failed) | Bisa debug saat ada user komplain "tidak menerima email" |

---

## 5. Persyaratan Fungsional

### 5.1 Mailer Service

- Modul baru `app.services.email_service` menyediakan fungsi `send_email(to, subject, html_body, text_body=None, headers=None, ical=None)`.
- **Tidak boleh memblokir HTTP request**. Pengiriman dilakukan secara **asynchronous** lewat queue/thread (lihat §10).
- Setiap pengiriman membuat satu baris di tabel `email_outbox` dengan status (`Queued` / `Sent` / `Failed`) untuk traceability.
- Failure di-retry dengan exponential backoff: 1 menit, 5 menit, 30 menit, lalu mark `Failed` permanen (max 3 retry).

### 5.2 Integrasi dengan Notification Pipeline yang Sudah Ada

Fungsi `notify_user` / `notify_employee` di [notification_service.py](../../CODE/be/app/services/notification_service.py) saat ini hanya create row `notifications`. Tambahkan parameter `send_email: bool = True` dan, setelah create in-app notification, panggil `email_service.send_event_email(...)` dengan template yang sesuai `entity_type`.

Pengiriman email **mengikuti preferensi user**:
- Jika `user_email_preferences.{entity_type}_enabled` = false → skip kirim email, tetap kirim in-app.
- Jika user `is_active = false` atau email kosong → skip.

### 5.3 Template Email

Setiap event memiliki template HTML + plain-text fallback. Disimpan sebagai Jinja2 template di `CODE/be/app/templates/email/<event_key>.html` dan `.txt`.

Template wajib menampilkan:
- Header: logo Indocyber + nama aplikasi "PMO".
- Body: konteks event (project name, task title, dst).
- Tombol CTA: "Buka di PMO" → link absolut ke `FRONTEND_BASE_URL + target_url`.
- Footer: "Anda menerima email ini karena terdaftar sebagai {role} di PMO. Atur preferensi email di Pengaturan Akun."
- Bahasa: **Indonesia** (konsisten dengan in-app notification yang sudah ada).

### 5.4 Lampiran Kalender (.ics) untuk Event Meeting (E-06..E-10)

Email undangan/perubahan/pembatalan meeting **wajib** menyertakan file `.ics` agar bisa di-add ke kalender:

- `METHOD:REQUEST` untuk undangan baru & update.
- `METHOD:CANCEL` untuk pembatalan.
- `UID` stabil per meeting (`meeting-{id}@pmo.indocyber.id`) → email client merge update dengan invitation sebelumnya.
- `ORGANIZER`, `ATTENDEE`, `DTSTART`, `DTEND`, `LOCATION`, `DESCRIPTION`, `URL`.

### 5.5 Preferensi Email per User

Tabel baru `user_email_preferences` (lihat §6). UI baru di halaman **Pengaturan / Profil** dengan toggle per kategori:

| Kategori | Default |
|---|---|
| Project assignment (E-01..E-03) | ON |
| Task assignment (E-04) | ON |
| Issue assignment & escalation (E-05, E-12) | ON |
| Meeting invites & changes (E-06..E-08) | ON |
| Meeting reminders (E-09, E-10) | ON |
| Action items (E-11) | ON |
| Account & security (E-14..E-16) | **Locked ON** (tidak bisa dimatikan — security) |

### 5.6 Suppression / Bounce Handling (v1.1)

Jika SMTP me-reject email (5xx) → tandai email user dengan flag `bounce_at` dan skip semua pengiriman berikut sampai admin reset. Untuk v1 cukup catat di log; suppression list otomatis = v1.1.

### 5.7 Log / Audit

Halaman admin baru **"Email Log"** menampilkan tabel `email_outbox` (filter status, tanggal, recipient). Akses dibatasi permission baru `adminEmailLogs.view`. Endpoint: `GET /api/v1/admin/email-outbox`.

---

## 6. Desain Database

### Tabel Baru — `email_outbox`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | Auto-increment |
| `to_email` | varchar(255) | Recipient |
| `to_user_id` | int FK → `users.id` nullable | Untuk join preferensi |
| `event_key` | varchar(60) | Kunci event (mis. `task.assigned`, `meeting.invited`, `auth.password_reset`) |
| `entity_type` | varchar(40) nullable | `task`, `issue`, `project`, `meeting`, `auth` |
| `entity_id` | varchar(64) nullable | ID entitas terkait |
| `subject` | varchar(255) | Subject baris email |
| `body_html` | text | Body HTML hasil render (untuk debugging — bisa di-purge >90 hari) |
| `body_text` | text | Plaintext fallback |
| `status` | varchar(20) | `Queued` / `Sending` / `Sent` / `Failed` |
| `attempts` | int default 0 | Counter retry |
| `last_error` | text nullable | Pesan error SMTP terakhir |
| `scheduled_at` | timestamp | Kapan boleh dikirim (untuk reminder dijadwalkan) |
| `sent_at` | timestamp nullable | Saat sukses terkirim |
| `created_at` | timestamp | Default now() |

Index: `(status, scheduled_at)`, `(to_user_id)`, `(event_key)`.

### Tabel Baru — `user_email_preferences`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | int FK → `users.id` PK | Cascade delete |
| `project_assignment` | boolean default true | E-01..E-03 |
| `task_assignment` | boolean default true | E-04 |
| `issue_events` | boolean default true | E-05, E-12 |
| `meeting_invites` | boolean default true | E-06..E-08 |
| `meeting_reminders` | boolean default true | E-09, E-10 |
| `action_items` | boolean default true | E-11 |
| `updated_at` | timestamp | Auto-update |

Default row dibuat saat user pertama login (lazy) atau saat employee → user dibuat.

### Tabel Tidak Berubah

Tidak ada perubahan ke `notifications`, `users`, `employees`, atau tabel meeting. Pengiriman email **murni additive**.

---

## 7. API Endpoints Baru

Semua di bawah `/api/v1`.

### 7.1 Preferensi Email User

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/me/email-preferences` | `get_email_preferences_handler` | JWT (self) |
| `PUT` | `/me/email-preferences` | `update_email_preferences_handler` | JWT (self) |

Response `GET`:
```json
{
  "data": {
    "project_assignment": true,
    "task_assignment": true,
    "issue_events": true,
    "meeting_invites": true,
    "meeting_reminders": true,
    "action_items": true
  }
}
```

`PUT` menerima body partial — hanya field yang dikirim akan diubah.

### 7.2 Email Outbox (Admin)

| Method | Endpoint | Handler | Permission |
|---|---|---|---|
| `GET` | `/admin/email-outbox` | `list_email_outbox_handler` | JWT + `adminEmailLogs.view` |
| `POST` | `/admin/email-outbox/<id>/resend` | `resend_email_handler` | JWT + `adminEmailLogs.manage` |

Query params untuk `GET`:
- `status` (optional): `Queued` / `Sent` / `Failed`
- `to_email` (optional): substring match
- `start_date` / `end_date`
- `page`, `per_page`

---

## 8. Konfigurasi Lingkungan

Tambahkan ke [CODE/be/app/config.py](../../CODE/be/app/config.py) dan dokumentasikan di README:

| Env Var | Default | Keterangan |
|---|---|---|
| `MAIL_ENABLED` | `false` | Master switch. False = skip semua pengiriman (untuk dev/test). |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP host |
| `MAIL_PORT` | `587` | SMTP port (TLS) |
| `MAIL_USE_TLS` | `true` | STARTTLS |
| `MAIL_USERNAME` | `agenda@indocyber.id` | Akun pengirim |
| `MAIL_PASSWORD` | *(rahasia, dari env)* | **Gmail App Password** — pisahkan dari source code (lihat §8.1) |
| `MAIL_FROM_NAME` | `PMO Indocyber` | Display name pengirim |
| `MAIL_FROM_ADDRESS` | `agenda@indocyber.id` | From header |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | Dipakai untuk membentuk link absolut di email |
| `MAIL_TEST_RECIPIENT` | *(kosong)* | Jika diset, semua email dialihkan ke alamat ini (untuk staging) |

### 8.1 Kredensial Saat Ini

Kredensial yang diberikan user untuk implementasi/test:

```
MAIL_USERNAME=agenda@indocyber.id
MAIL_PASSWORD=rwjw zbsd azzo gyhs   # Gmail App Password — JANGAN commit ke git
```

App Password ini **wajib disimpan di `.env`** (yang harus ada di `.gitignore`) atau di secrets manager Docker. Jangan hardcode di kode. Sebelum production, rotate password ini.

---

## 9. File-File yang Akan Dibuat / Diubah

### Backend (Baru)

| File | Keterangan |
|---|---|
| `CODE/be/app/services/email_service.py` | Fungsi `send_email`, `enqueue_email`, render template, lampirkan .ics |
| `CODE/be/app/services/email_dispatcher.py` | Worker yang membaca `email_outbox` status=`Queued` dan benar-benar kirim SMTP |
| `CODE/be/app/services/ics_builder.py` | Helper bentuk file `.ics` untuk event meeting |
| `CODE/be/app/models/email_outbox.py` | Model `EmailOutbox` |
| `CODE/be/app/models/user_email_preference.py` | Model `UserEmailPreference` |
| `CODE/be/app/api/v1/email_preferences.py` | Handler GET/PUT preferensi |
| `CODE/be/app/api/v1/admin_email.py` | Handler admin outbox |
| `CODE/be/app/templates/email/base.html` | Layout master (header logo + footer) |
| `CODE/be/app/templates/email/project_assigned.html` + `.txt` | E-01..E-03 |
| `CODE/be/app/templates/email/task_assigned.html` + `.txt` | E-04 |
| `CODE/be/app/templates/email/issue_assigned.html` + `.txt` | E-05 |
| `CODE/be/app/templates/email/meeting_invited.html` + `.txt` | E-06 |
| `CODE/be/app/templates/email/meeting_updated.html` + `.txt` | E-07 |
| `CODE/be/app/templates/email/meeting_cancelled.html` + `.txt` | E-08 |
| `CODE/be/app/templates/email/meeting_reminder.html` + `.txt` | E-09, E-10 |
| `CODE/be/app/templates/email/action_item_assigned.html` + `.txt` | E-11 |
| `CODE/be/app/templates/email/issue_escalated.html` + `.txt` | E-12 |
| `CODE/be/app/templates/email/welcome_employee.html` + `.txt` | E-14 |
| `CODE/be/app/templates/email/password_reset.html` + `.txt` | E-15 |
| `CODE/be/app/templates/email/password_changed.html` + `.txt` | E-16 |
| `CODE/be/app/cli/email_worker.py` | CLI command `flask email-worker` untuk run dispatcher loop |
| `CODE/be/app/cli/meeting_reminders.py` | CLI command `flask meeting-reminders` (cron daily) |
| `CODE/be/migrations/versions/<hash>_add_email_outbox_and_preferences.py` | Alembic migration |
| `CODE/be/tests/test_email_service.py` | Unit test render template & queue logic |
| `CODE/be/tests/test_email_preferences_api.py` | API test GET/PUT prefs |
| `CODE/be/tests/test_email_meeting_invite.py` | Test bahwa POST meeting men-enqueue email + .ics untuk semua attendee |

### Backend (Diubah)

| File | Perubahan |
|---|---|
| `CODE/be/app/__init__.py` | Register Jinja env untuk email templates, register CLI |
| `CODE/be/app/api/v1/__init__.py` | Daftarkan blueprint `email_preferences` dan `admin_email` |
| `CODE/be/app/config.py` | Tambah `MAIL_*` + `FRONTEND_BASE_URL` |
| `CODE/be/app/services/notification_service.py` | Setelah create `Notification`, panggil `email_service.enqueue_event_email(...)` |
| `CODE/be/app/services/meeting_service.py` | Setelah create/update/delete meeting + attendee changes → enqueue E-06/E-07/E-08 |
| `CODE/be/app/services/meeting_note_service.py` | Setelah create/update action item dengan assignee → enqueue E-11 |
| `CODE/be/app/services/issue_service.py` | Setelah escalate → enqueue E-12 |
| `CODE/be/app/services/auth_service.py` | Setelah change-password sukses → enqueue E-16 |
| `CODE/be/app/services/employee_service.py` | Setelah create employee → enqueue E-14; setelah reset password → enqueue E-15 |
| `CODE/be/app/utils/permissions.py` | Tambah `adminEmailLogs.view`, `adminEmailLogs.manage` |
| `CODE/be/requirements.txt` | Tambah `Jinja2` (sudah implicit via Flask), `icalendar==5.0.13` |
| `CODE/be/docker-compose.yml` (atau root) | Tambah service `email-worker` opsional yang menjalankan `flask email-worker` |

### Frontend (Baru)

| File | Keterangan |
|---|---|
| `CODE/fe/src/app/pages/profile/EmailPreferencesPage.tsx` | Halaman toggle preferensi |
| `CODE/fe/src/app/pages/admin/EmailOutboxPage.tsx` | Halaman log email (admin) |
| `CODE/fe/src/app/services/emailPreferencesApi.ts` | API client preferensi |
| `CODE/fe/src/app/services/adminEmailApi.ts` | API client admin outbox |

### Frontend (Diubah)

| File | Perubahan |
|---|---|
| `CODE/fe/src/app/routes.ts` | Tambah `/pengaturan/email` dan `/admin/email-log` |
| `CODE/fe/src/app/components/layout/AppShell.tsx` | Tambah menu Pengaturan → Notifikasi Email; menu Admin → Email Log |

---

## 10. Pertimbangan Teknis

### 10.1 Asynchronous Sending — Pendekatan v1

**Tujuan:** request POST `/tasks` atau `/meetings` tidak boleh ikut menunggu SMTP handshake (bisa lambat / timeout).

Pendekatan v1 minimalis (tanpa Redis/Celery):

1. Saat event terjadi, service hanya **INSERT row** ke `email_outbox` dengan status `Queued`. Cepat (< 5 ms).
2. Worker terpisah `flask email-worker` berjalan terus-menerus, polling tabel tiap 5 detik untuk `status='Queued' AND scheduled_at<=now()`, lalu kirim SMTP, update status.
3. Worker bisa dijalankan sebagai container terpisah di `docker-compose` atau sebagai background thread di app process (lebih simple untuk dev — feature flag `MAIL_INLINE_WORKER=true`).

**Kenapa bukan Celery/RQ:** menambah Redis hanya untuk email mahal di tahap prototype. Pendekatan polling DB cukup sampai ~1000 email/jam. Migrasi ke task queue bisa dilakukan tanpa mengubah API publik.

### 10.2 Idempotency

Setiap enqueue menyertakan `(event_key, entity_id, to_user_id, scheduled_at_bucket)` sebagai natural key. Jika row sudah ada dan belum `Sent`, jangan duplikasi (mencegah double-send saat user reassign cepat berturut-turut).

### 10.3 Timezone

- Backend simpan semua datetime UTC.
- Template email render dengan timezone **Asia/Jakarta (WIB / +07:00)** sebagai default. Future: ambil dari preferensi user.
- File `.ics` selalu pakai UTC dengan suffix `Z` (RFC 5545).

### 10.4 Bahasa Template

Semua email berbahasa Indonesia. Tidak ada i18n switching di v1 (sejalan dengan in-app yang juga ID-only).

### 10.5 Keamanan & Privasi

- `body_html` di outbox bisa berisi info sensitif (judul task internal). Akses log dibatasi `adminEmailLogs.view`. Body di-purge otomatis >90 hari (cron `flask purge-email-bodies`).
- Email tidak menyertakan **isi penuh** dokumen / komentar sensitif — hanya judul + link. User harus login PMO untuk melihat detail.
- SMTP password disimpan hanya di env, tidak di-log.
- Header email tambah `List-Unsubscribe: <mailto:agenda@indocyber.id?subject=Unsubscribe>` (opsional v1.1).

### 10.6 Reliabilitas Gmail SMTP

Gmail App Password memiliki **batas kirim ~500 email/hari** untuk akun gratis dan ~2000/hari untuk Workspace. Pada skala prototype ini cukup, tetapi:
- Untuk volume lebih besar di production, migrasi ke SMTP relay seperti SendGrid / Amazon SES (interface SMTP sama → minim perubahan kode).
- Tambahkan monitoring: jika rate dispatch `Failed` > 20% dalam 1 jam, kirim alert ke admin (v1.1).

### 10.7 Testing

- Test backend pakai `MAIL_ENABLED=false` agar tidak ada panggilan SMTP nyata.
- Mock `smtplib.SMTP` dengan `pytest-mock` untuk verifikasi argumen `sendmail`.
- Test integration: enqueue → run dispatcher → assert row `Sent`.
- Manual test script `scripts/send_test_email.py` mengirim satu test email ke alamat di `MAIL_TEST_RECIPIENT`.

---

## 11. Acceptance Criteria

| ID | Kriteria | Cara Verifikasi |
|---|---|---|
| AC-01 | Setiap event E-01..E-05 men-enqueue 1 baris di `email_outbox` dengan template dan recipient yang benar | Trigger create task, query `email_outbox` |
| AC-02 | POST `/meetings` dengan 3 attendee membuat 3 baris outbox dengan event_key `meeting.invited` dan lampiran .ics METHOD=REQUEST | Integration test E-06 |
| AC-03 | PATCH `/meetings/<id>` yang mengubah `start_datetime` men-enqueue 3 email update (METHOD=REQUEST sama UID) | Test E-07 |
| AC-04 | DELETE `/meetings/<id>` atau set status Cancelled men-enqueue 3 email cancellation (METHOD=CANCEL) | Test E-08 |
| AC-05 | CLI `flask email-worker` mengirim semua email Queued dan menandai `Sent` | Run worker di staging, periksa Mailtrap |
| AC-06 | User dengan `task_assignment=false` tidak menerima email task tetapi tetap menerima in-app | Toggle prefs, assign task |
| AC-07 | Welcome email (E-14) berisi default password dan link login | Buat employee baru, periksa Mailtrap |
| AC-08 | Password reset & change (E-15, E-16) selalu dikirim walau prefs lain off | Toggle semua off, lakukan change password |
| AC-09 | Pengiriman gagal di-retry max 3x lalu di-mark Failed | Set host SMTP invalid, watch `attempts` dan `status` |
| AC-10 | File .ics yang dilampirkan bisa di-import ke Gmail Calendar dan menampilkan judul + waktu yang benar | Manual test |
| AC-11 | API POST tetap < 500 ms saat enqueue (tidak menunggu SMTP) | Apache Bench / curl --write-out |
| AC-12 | `MAIL_ENABLED=false` mematikan semua pengiriman tanpa error | Run pytest, tidak ada koneksi SMTP |
| AC-13 | Halaman Email Log menampilkan filter status dan resend berfungsi | Manual frontend test |
| AC-14 | Semua endpoint baru dilindungi JWT dan permission yang tepat | Request tanpa token → 401; tanpa permission → 403 |
| AC-15 | `pytest CODE/be/tests/test_email_*.py` hijau | CI green |

---

## 12. Out of Scope (Versi Pertama)

- Digest harian / mingguan ("ringkasan minggu Anda").
- Inbound email (membalas email untuk auto-create comment / RSVP).
- Template editor di UI.
- Multi-bahasa template (i18n).
- Webhook bounce handler dari Gmail.
- Unsubscribe one-click via tombol di email.
- Push notification (FCM/APNs).
- WhatsApp / Telegram channel.

---

## 13. Update Dokumen AI Context yang Diperlukan

Setelah implementasi selesai, wajib update:

| Dokumen | Update |
|---|---|
| [docs/ai-context/feature-map.md](../ai-context/feature-map.md) | Tambah fitur **Email Notifications** + **User Email Preferences** + **Email Log (admin)** |
| [docs/ai-context/api-map.md](../ai-context/api-map.md) | Tambah `/me/email-preferences`, `/admin/email-outbox`, `/admin/email-outbox/<id>/resend` |
| [docs/ai-context/database.md](../ai-context/database.md) | Tambah tabel `email_outbox`, `user_email_preferences` |
| [docs/ai-context/features/notifications.md](../ai-context/features/notifications.md) | Catat bahwa setiap `notify_user` kini ikut men-enqueue email sesuai preferensi |
| [docs/ai-context/architecture.md](../ai-context/architecture.md) | Tambah seksi "Email Pipeline" — enqueue → outbox → worker |
| README backend | Tambah panduan run `flask email-worker` dan env `MAIL_*` |

---

## 14. Ringkasan Eksekutif (TL;DR)

- **13 event** yang akan memicu email; 5 di antaranya sudah punya in-app notification dan tinggal "diperluas", 8 sisanya baru (mayoritas terkait Meeting Agenda yang sebelumnya di-defer).
- **2 tabel baru** (`email_outbox`, `user_email_preferences`) + 3 endpoint user + 2 endpoint admin.
- **Async via DB-polling worker** — tanpa Redis/Celery; bisa di-upgrade nanti.
- **Gmail SMTP** memakai akun `agenda@indocyber.id` dengan App Password (simpan di `.env`, jangan commit).
- **Lampiran .ics** untuk semua event meeting → integrasi alami ke Google Calendar / Outlook.
- **Preferensi per user** dengan kategori Security (E-14..E-16) yang tidak bisa dimatikan.
