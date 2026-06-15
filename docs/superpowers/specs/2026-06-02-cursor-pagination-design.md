# PRD — Pagination Server-Side (Cursor-Based) untuk Daftar Data

- **Tanggal:** 2026-06-02
- **Status:** Draft (menunggu review)
- **Penulis:** Tim Engineering ZOHO PM
- **Area:** Backend (Flask `CODE/be`) + Frontend (React `CODE/fe`)

---

## 1. Latar Belakang & Masalah

Saat ini **semua daftar data dipaginasi di sisi browser (client-side)**:

- Endpoint list backend mengembalikan **seluruh baris** dalam satu array, dibungkus envelope `{ "data": [...] }` — tanpa total, tanpa limit. Contoh: [`projects.py:43-48`](../../../CODE/be/app/api/v1/projects.py#L43-L48) memanggil `project_service.list_projects()` → `ProjectRepository.list_projects()` yang menjalankan `Project.query...all()` ([`project_repository.py:6-7`](../../../CODE/be/app/repositories/project_repository.py#L6-L7)).
- Frontend mengambil semua data sekaligus lalu memotongnya di memori. Lihat [`ProjectList.tsx:117-138`](../../../CODE/fe/src/app/pages/proyek/ProjectList.tsx#L117-L138): `fetchProjects()` mengambil semua proyek, `filteredProjects` mem-filter di browser, `paginatedProjects` melakukan `.slice(start, start+PAGE_SIZE)`.
- `PaginationControls` ([`PaginationControls.tsx`](../../../CODE/fe/src/app/components/ui/PaginationControls.tsx)) menghitung halaman dari `totalItems = filteredProjects.length` — yaitu jumlah data yang **sudah** diunduh, bukan jumlah sebenarnya di database.

### Dampak masalah
1. **Skalabilitas:** payload membengkak seiring data bertambah; transfer & render ribuan baris memberatkan jaringan dan browser.
2. **Total tidak akurat:** "total" hanyalah panjang array yang sudah diunduh, bukan jumlah riil di DB.
3. **Search/filter bias:** karena search jalan di browser, ia hanya bisa mencari di data yang sudah diunduh.

### Tujuan
Memindahkan pagination, search, dan filter ke **backend**, dengan kontrak respons yang menyertakan: **jumlah total dari DB**, **link halaman berikutnya**, **link halaman sebelumnya**, dan **isi list tepat sebanyak yang diminta** (mis. minta 15 → kembali 15; item ke-16–30 ada di halaman berikutnya).

### Non-Tujuan (YAGNI)
- **Tidak** menyediakan fitur loncat ke nomor halaman tertentu (mis. klik "halaman 7"). Navigasi hanya **Berikutnya/Sebelumnya** (keputusan disepakati).
- Tidak mengubah skema database (selain memastikan kolom sort ter-index).
- Tidak mengganti mekanisme auth/permission yang sudah ada.
- Tidak menambah infinite-scroll (tetap kontrol tombol).

---

## 2. Keputusan Desain (Hasil Diskusi)

| Topik | Keputusan |
|---|---|
| Gaya pagination | **Cursor-based (keyset)** — token cursor opaque, navigasi Next/Prev saja, tanpa loncat halaman |
| Search & filter | **Dipindah ke backend** — diterima sebagai query param, difilter di DB sebelum dipaginasi |
| Cakupan | **Bertahap.** Fase 1: data bervolume besar. Fase 2: master kecil |
| Bentuk envelope | `{ "data": { "items": [...], "meta": {...}, "links": {...} } }` |

**Mengapa cursor-based?** Untuk daftar yang datanya tumbuh dan sering berubah, keyset pagination konsisten (tidak ada baris terlewat/ganda saat data bergeser di antara permintaan) dan efisien (`WHERE key > cursor LIMIT n` memakai index, tanpa `OFFSET` yang melambat di halaman jauh). Konsekuensinya navigasi hanya maju/mundur — dan itu sudah disepakati cukup.

---

## 3. Kontrak API Baru

### 3.1 Query parameter (semua endpoint list dalam cakupan)

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `per_page` | int | `15` | Jumlah item per halaman. Dibatasi `1..100`. Di luar rentang → di-*clamp*. |
| `cursor` | string (opaque) | — | Token posisi. Kosong/absen = mulai dari halaman pertama. |
| `q` | string | — | Kata kunci pencarian (opsional, per-resource menentukan kolom yang dicari). |
| *filter resource* | string | — | Filter spesifik resource, mis. `status`, `priority`, `project_id`, `assignee`. |

Catatan: **arah** (next/prev) **tidak** dikirim sebagai param terpisah — ia di-*encode* di dalam token `cursor`, sehingga link dari server bisa dipakai apa adanya oleh klien.

### 3.2 Bentuk respons

```jsonc
{
  "data": {
    "items": [ /* tepat <= per_page item */ ],
    "meta": {
      "total": 132,        // jumlah total baris setelah filter (COUNT di DB)
      "per_page": 15,
      "count": 15,         // jumlah item di halaman ini
      "has_next": true,
      "has_prev": false
    },
    "links": {
      "self": "/api/v1/projects?per_page=15",
      "next": "/api/v1/projects?per_page=15&cursor=eyJrIjpb...fQ",
      "prev": null         // null bila tidak ada halaman sebelumnya
    }
  }
}
```

- `next`/`prev` berupa **URL relatif lengkap** (path + query + cursor + per_page + filter yang dipertahankan). Bila tidak ada, bernilai `null`.
- **Tidak ada `page`/`total_pages` yang dapat dinavigasi** karena cursor-based. `total` tetap disediakan untuk ditampilkan ("Menampilkan 1–15 dari 132 data"). Nomor halaman, bila ingin ditampilkan, dihitung & dilacak di sisi klien sebagai indikator saja.

### 3.3 Struktur token `cursor`

Token = `base64url( JSON )` tanpa padding, isi:

```jsonc
{ "k": [<nilai kolom sort baris batas>, ...], "d": "next" | "prev" }
```

- `k` = nilai kolom kunci sort dari baris **batas** (baris terakhir untuk `next`, baris pertama untuk `prev`).
- `d` = arah.
- Token bersifat **opaque** bagi klien (jangan diparse di FE). Token invalid/rusak → `400 Bad Request` dengan pesan jelas; klien menanganinya dengan kembali ke halaman pertama (`cursor` dikosongkan).
- Token **tidak** ditandatangani (tidak ada data sensitif), hanya encoding. (Opsi penandatanganan dicatat di Open Questions.)

### 3.4 Error

| Kondisi | HTTP | Body |
|---|---|---|
| `per_page` bukan angka | 400 | `{ "message": "Parameter per_page tidak valid." }` |
| `cursor` rusak/tidak bisa di-decode | 400 | `{ "message": "Cursor tidak valid." }` |
| Tanpa permission | 403 | (mengikuti mekanisme `require_*permission` yang ada) |

---

## 4. Desain Backend

### 4.1 Komponen baru: helper pagination

Modul baru **`CODE/be/app/utils/pagination.py`** — satu sumber kebenaran agar tiap endpoint tidak menulis ulang logika.

Tanggung jawab (antarmuka jelas, dapat diuji terisolasi):

1. **`parse_pagination_args(request)`** → `(per_page, cursor_payload | None)`. Membaca & memvalidasi `per_page` (clamp 1..100) dan men-decode `cursor`.
2. **`encode_cursor(values, direction)` / `decode_cursor(token)`** → token ↔ payload.
3. **`paginate(query, sort_spec, per_page, cursor_payload, request)`** → dict `{ items, meta, links }`. Inti algoritma:
   - `sort_spec` = daftar `(kolom, arah)` di mana **kolom terakhir wajib unik** (mis. primary key `id`) sebagai tie-breaker → urutan deterministik.
   - Hitung `total` dengan `func.count()` atas query terfilter (tanpa klausa keyset/limit/order).
   - Terapkan klausa keyset (`WHERE (k1,k2,..,id) > / < cursor` sesuai arah & arah kolom, ekspansi lexicographic untuk campuran ASC/DESC).
   - `LIMIT per_page + 1` untuk mendeteksi `has_next`/`has_prev`; buang baris ekstra.
   - Untuk `prev`: balik arah order saat query, lalu balik kembali urutan hasil.
   - Bangun `links.next`/`links.prev` dari `request.path` + query string yang dipertahankan (semua filter + `per_page`) + token cursor baru dari baris batas.

### 4.2 Helper respons

Tambah **`paginated_response(result, message=None)`** di [`CODE/be/app/utils/http.py`](../../../CODE/be/app/utils/http.py) yang membungkus `{ "data": { items, meta, links } }`. `success_response` lama tetap ada untuk endpoint non-list.

### 4.3 Perubahan per lapisan (pola seragam)

Untuk tiap resource dalam cakupan:

- **Repository**: ubah `list_*` agar **mengembalikan query (belum `.all()`)** + menerima argumen filter/search. Mis. `TaskRepository.list_tasks` sudah menerima `search`/`project_id` ([`task_repository.py:7-21`](../../../CODE/be/app/repositories/task_repository.py#L7-L21)) — tinggal hentikan `.all()` di akhir dan kembalikan query, atau sediakan varian `query_tasks(...)`.
- **Service**: terima `per_page`, `cursor_payload`, dan dict filter; panggil repository untuk dapat query; panggil `paginate(...)`; kembalikan dict hasil. Marshmallow `*_schema.dump` diterapkan ke `result["items"]` saja.
- **Endpoint (API)**: baca query param via `parse_pagination_args`, teruskan filter, panggil service, kembalikan `paginated_response(...)`. Permission/JWT tidak berubah.

### 4.4 Sort key per resource (rekomendasi)

| Resource | Sort key (keyset) | Catatan index |
|---|---|---|
| Projects | `name ASC, id ASC` | Pertahankan urutan saat ini |
| Tasks | `id ASC` (atau `created_at DESC, id DESC`) | `id` sudah PK |
| Issues | `created_at DESC, id DESC` | terbaru dulu |
| Employees | `name ASC, id ASC` | |
| Email Outbox | `created_at DESC, id DESC` | |
| Notifications | `created_at DESC, id DESC` | per-user |
| Audit Trails | `created_at DESC, id DESC` | volume tinggi → pastikan index |

Aksi: tambahkan index DB pada kolom sort non-PK yang dipakai (mis. `created_at`) bila belum ada.

---

## 5. Desain Frontend

### 5.1 Lapisan apiClient

Tambah tipe & helper di [`apiClient.ts`](../../../CODE/fe/src/app/services/apiClient.ts):

```ts
export type PageMeta = { total: number; per_page: number; count: number; has_next: boolean; has_prev: boolean };
export type PageLinks = { self: string; next: string | null; prev: string | null };
export type Paginated<T> = { items: T[]; meta: PageMeta; links: PageLinks };
```

`apiRequest` sudah mengembalikan `{ data }`; untuk list, `data` kini berbentuk `Paginated<T>`.

### 5.2 Lapisan service (`*Api.ts`)

Tiap `fetchX` diberi parameter dan mengembalikan halaman, bukan array penuh. Contoh untuk [`projectApi.ts`](../../../CODE/fe/src/app/services/projectApi.ts):

```ts
type ListParams = { cursorUrl?: string; perPage?: number; q?: string; status?: string; /* ... */ };

export async function fetchProjects(params: ListParams = {}): Promise<Paginated<ApiProject>> {
  // bila cursorUrl ada (dari links.next/prev), pakai apa adanya;
  // selain itu rakit query dari perPage + q + filter.
  const path = params.cursorUrl ?? buildQuery("/projects", params);
  const result = await apiRequest<Paginated<ApiProject>>(path, { method: "GET" });
  return result.data;
}
```

Klien **memakai `links.next`/`links.prev` apa adanya** untuk berpindah halaman (tidak merakit cursor sendiri).

### 5.3 `PaginationControls` (didesain ulang ke mode cursor)

Komponen lama berbasis nomor halaman & dipakai di banyak halaman. Diganti antarmuka cursor:

```ts
type PaginationControlsProps = {
  total: number;
  rangeStart: number;   // dihitung klien untuk tampilan
  rangeEnd: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};
```

Render tetap: teks "Menampilkan X–Y dari `total` data" + tombol **Sebelumnya/Berikutnya** (disabled sesuai `hasPrev`/`hasNext`). Tanpa tombol nomor halaman.

### 5.4 Pola halaman list (seragam)

Mengganti pola "fetch semua + slice" dengan state berbasis cursor. State kunci per halaman:

- `items`, `meta`, `links` (dari respons terakhir).
- `q`/filter (kontrol input). Perubahan filter → reset ke halaman pertama (cursor dikosongkan).
- Navigasi: tombol Berikutnya → `fetchX({ cursorUrl: links.next! })`; Sebelumnya → `fetchX({ cursorUrl: links.prev! })`.
- Search di-*debounce* (mis. 300 ms) lalu memicu fetch ke halaman pertama.
- Untuk menampilkan nomor halaman indikatif (opsional), klien melacak counter halaman lokal (naik saat Next, turun saat Prev, reset saat filter berubah).

Halaman yang menyisipkan item baru hasil "create" (mis. `setProjects(prev => [result.data, ...prev])` di [`ProjectList.tsx:262`](../../../CODE/fe/src/app/pages/proyek/ProjectList.tsx#L262)) diubah menjadi **refetch halaman pertama** setelah create/update/delete, agar konsisten dengan urutan server.

---

## 6. Cakupan per Menu & API

### Fase 1 — data bervolume besar (prioritas)

| Menu (UI) | Halaman Frontend | Endpoint Backend | Service / Repository | Filter/Search yang dipindah ke BE |
|---|---|---|---|---|
| Proyek — Portofolio | [`proyek/ProjectList.tsx`](../../../CODE/fe/src/app/pages/proyek/ProjectList.tsx) | `GET /projects` | `project_service.list_projects` / `ProjectRepository` | `q`, `status`, `priority`, `manager_id` |
| Tugas — Daftar Tugas | [`tugas/TaskList.tsx`](../../../CODE/fe/src/app/pages/tugas/TaskList.tsx) | `GET /tasks` | `task_service` / `TaskRepository.list_tasks` | `q`, `project_id`, `phase_id`, `priority`, `assignee` |
| Tugas Saya | [`tugas/MyTasksPage.tsx`](../../../CODE/fe/src/app/pages/tugas/MyTasksPage.tsx) | `GET /tasks` (assignee = user) | `task_service` / `TaskRepository.list_tasks` | `q`, `status`, `priority` |
| Isu | [`isu/IssueList.tsx`](../../../CODE/fe/src/app/pages/isu/IssueList.tsx) | `GET /issues` | `issue_service` / `issue_repository` | `q`, `status`, `severity`, `project_id` |
| Master Pegawai | [`master/EmployeeMaster.tsx`](../../../CODE/fe/src/app/pages/master/EmployeeMaster.tsx) | `GET /employees` | `employee_service` / `employee_repository` | `q`, `organization`, `position`, `status` |
| Admin — Email Outbox | [`admin/EmailOutboxPage.tsx`](../../../CODE/fe/src/app/pages/admin/EmailOutboxPage.tsx) | `GET /admin/email-outbox` | `email_service` | `q`, `status` |
| Notifikasi | [`kustomisasi/NotificationsPage.tsx`](../../../CODE/fe/src/app/pages/kustomisasi/NotificationsPage.tsx) | `GET /notifications` | `notification_service` / `notification_repository` | status baca/belum dibaca |
| Audit Trail (backend-ready) | — (FE menyusul bila ada halaman daftar) | `GET /audit-trails` | `audit_trail_service` | `q`, `action`, rentang tanggal |

> Catatan: `GET /audit-trails` belum punya halaman daftar yang memakai `PaginationControls` saat ini; backend tetap dipaginasi di Fase 1 karena datanya tumbuh terus. Integrasi FE menyusul saat halaman daftarnya dibuat.

### Fase 2 — master kecil

| Menu (UI) | Halaman Frontend | Endpoint Backend | Service / Repository | Filter/Search |
|---|---|---|---|---|
| Master Peran | [`master/RoleMaster.tsx`](../../../CODE/fe/src/app/pages/master/RoleMaster.tsx) | `GET /roles` | `role_service` / `role_repository` | `q`, `status` |
| Master Referensi | [`master/ReferenceMaster.tsx`](../../../CODE/fe/src/app/pages/master/ReferenceMaster.tsx) | `GET /organizations`, `GET /organization-units`, `GET /positions` | `organization_service`, `organization_unit_service`, `position_service` | `q`, `status` |

> Data master umumnya kecil; pagination di sini lebih untuk konsistensi kontrak daripada performa. Karena itu ditaruh di Fase 2.

### Endpoint list yang **dikecualikan** (sengaja tetap array)
Endpoint sub-koleksi kecil dan terikat satu induk dibiarkan apa adanya untuk menghindari kompleksitas tak perlu (YAGNI): `GET /projects/<id>/phases`, `/members`, `/holidays`, `/attachments/*`, `GET /tasks/<id>/comments`, `/checklist`, `meeting notes/files`, `/sla-config`, `/roles/reference`, `/me/email-preferences`, `/auth/my-projects`. Bila salah satunya kelak bervolume besar, dapat menyusul memakai helper yang sama.

---

## 7. Edge Cases & Penanganan

1. **Halaman pertama tanpa cursor** → `links.prev = null`, `has_prev = false`.
2. **Halaman terakhir** → `links.next = null`, `has_next = false`.
3. **Cursor menunjuk baris yang sudah terhapus** → keyset memakai perbandingan nilai, bukan ID acuan langsung; baris terhapus otomatis terlewati tanpa error.
4. **Data berubah antar-permintaan** → keyset stabil; tidak ada duplikasi/lewatan seperti pada OFFSET.
5. **`per_page` di luar 1..100** → di-clamp; tetap 200 OK.
6. **Cursor rusak** → 400; FE menangani dengan reset ke halaman pertama.
7. **Hasil filter kosong** → `items: []`, `total: 0`, kedua link `null`.
8. **Search + cursor lama** → saat filter/`q` berubah, FE wajib membuang cursor lama (mulai dari halaman pertama), karena cursor terikat pada himpunan terfilter sebelumnya.

---

## 8. Kompatibilitas & Migrasi

Ini **breaking change** pada bentuk respons endpoint list dalam cakupan (`data` berubah dari array → objek `{items,meta,links}`).

- Backend & frontend untuk satu resource **diubah dalam satu PR** agar tidak ada periode tak-kompatibel.
- Tidak ada konsumen eksternal lain yang diketahui (FE ini satu-satunya klien). Bila ada integrasi pihak ketiga, perlu dikonfirmasi (lihat Open Questions).
- Urutan kerja per resource: (1) helper pagination & `paginated_response` (sekali saja), (2) endpoint+service+repo resource, (3) `*Api.ts`, (4) halaman + `PaginationControls`, (5) tes.

---

## 9. Rencana Pengujian

**Backend (unit + integrasi):**
- Helper `encode/decode_cursor` round-trip; token rusak → error tertangani.
- `paginate`: jumlah item == `per_page`; halaman ke-2 berisi item ke-(per_page+1) dst.; tidak ada tumpang tindih antar halaman; `total` benar; `has_next/has_prev` benar di awal/tengah/akhir.
- Keyset dengan sort campuran (ASC+DESC) tetap deterministik dengan tie-breaker `id`.
- Filter + pagination gabungan: `total` mencerminkan hasil terfilter.

**Frontend:**
- `fetchX` memakai `links.next`/`prev` apa adanya.
- Mengubah `q`/filter mereset ke halaman pertama.
- Tombol Sebelumnya/Berikutnya disabled sesuai `has_prev`/`has_next`.
- Setelah create/update/delete → refetch halaman pertama.

---

## 10. Rollout

1. **Fase 0:** Merge helper pagination + `paginated_response` + redesign `PaginationControls` (dengan satu resource percontohan: **Proyek**) untuk memvalidasi pola end-to-end.
2. **Fase 1:** Sisa resource bervolume besar (Tugas, Tugas Saya, Isu, Pegawai, Email Outbox, Notifikasi; backend Audit Trail).
3. **Fase 2:** Master kecil (Peran, Referensi).

Tiap resource = satu PR backend+frontend yang dapat diuji & dirilis mandiri.

---

## 11. Risiko

| Risiko | Mitigasi |
|---|---|
| Keyset dengan sort campuran salah implementasi | Helper terpusat + tes deterministik; kolom tie-breaker unik wajib |
| Performa COUNT pada tabel besar | Index pada kolom filter/sort; pertimbangkan estimasi count bila perlu (Open Questions) |
| Inkonten FE saat create menyisipkan item lokal | Ganti ke refetch halaman pertama |
| Breaking change terlewat di salah satu konsumen | Ubah BE+FE resource dalam satu PR |

---

## 12. Open Questions

1. Apakah ada konsumen API selain frontend ini (mobile/integrasi pihak ketiga) yang akan terdampak perubahan bentuk respons?
2. Apakah `total` harus selalu akurat (COUNT penuh) bahkan untuk tabel sangat besar seperti Audit Trail, atau boleh estimasi demi performa?
3. Perlukah cursor ditandatangani (mis. HMAC) untuk mencegah pengguna merakit cursor sembarang, atau cukup opaque biasa?
4. Apakah `per_page` perlu bisa diubah pengguna dari UI (mis. 15/30/50), atau tetap konstan per menu?
