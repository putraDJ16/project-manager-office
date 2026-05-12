# Prompt Implementasi AI-Ready Context Documentation

Dokumen ini berisi prompt siap pakai untuk mengimplementasikan strategi agar AI agent tidak perlu eksplorasi kodebase terlalu luas sebelum memahami fitur yang akan diubah.

---

## 1. Prompt Utama: Membuat Dokumentasi AI Context Project

Gunakan prompt ini pada AI agent/code assistant di repository Anda.

```md
Anda adalah AI Engineering Agent yang bertugas menyiapkan dokumentasi konteks kodebase agar perubahan fitur berikutnya bisa dilakukan secara cepat, presisi, dan minim eksplorasi kodebase.

Tujuan utama:
Membangun struktur dokumentasi AI-ready untuk kodebase ini, sehingga setiap perubahan fitur dapat diarahkan melalui dokumen konteks, bukan eksplorasi source code dari nol.

Tugas Anda:
1. Analisis struktur kodebase secara menyeluruh tetapi terkontrol.
2. Identifikasi arsitektur aplikasi, modul utama, fitur utama, API, database/model, service, controller, frontend component, dan test terkait.
3. Buat dokumentasi konteks AI di dalam folder `/docs/ai-context/`.
4. Buat file instruksi agent di root project bernama `AGENTS.md`.
5. Jangan melakukan refactor source code aplikasi.
6. Jangan mengubah logic aplikasi.
7. Fokus hanya membuat dokumentasi, mapping, dan panduan kerja untuk AI agent berikutnya.

Struktur file yang harus dibuat:

```text
AGENTS.md

/docs/ai-context/
  overview.md
  architecture.md
  coding-rules.md
  feature-map.md
  api-map.md
  database.md
  testing.md
  change-recipes.md
  features/
    <nama-fitur-1>.md
    <nama-fitur-2>.md
    <nama-fitur-3>.md
```

Isi yang wajib dibuat:

## 1. AGENTS.md

Buat instruksi utama untuk AI agent yang akan bekerja di repo ini.

Isi minimal:

- Agent wajib membaca `/docs/ai-context/overview.md`
- Agent wajib membaca `/docs/ai-context/feature-map.md`
- Agent wajib membaca dokumen fitur terkait di `/docs/ai-context/features/`
- Agent hanya boleh mengubah file yang relevan dengan fitur yang diminta
- Agent tidak boleh refactor modul lain tanpa instruksi eksplisit
- Agent wajib menjaga API contract existing
- Agent wajib menambahkan atau memperbarui test jika business logic berubah
- Agent wajib memperbarui dokumen AI context jika mapping file, API, database, atau flow fitur berubah

## 2. /docs/ai-context/overview.md

Jelaskan ringkasan kodebase:

- Nama aplikasi/proyek
- Tujuan aplikasi
- Stack teknologi yang digunakan
- Struktur folder utama
- Entry point backend
- Entry point frontend
- Cara menjalankan aplikasi
- Cara menjalankan test
- Konvensi umum project

## 3. /docs/ai-context/architecture.md

Jelaskan arsitektur teknis:

- Pola arsitektur backend
- Pola arsitektur frontend
- Layering aplikasi, misalnya controller, service, repository, model
- Alur request dari frontend ke backend
- Cara error handling
- Cara authentication/authorization
- Cara konfigurasi environment
- Dependency penting antar modul

## 4. /docs/ai-context/coding-rules.md

Dokumentasikan aturan coding project:

- Naming convention
- Struktur file
- Lokasi business logic
- Lokasi validasi
- Lokasi query database
- Format response API
- Format error response
- Aturan import
- Hal yang tidak boleh dilakukan oleh AI agent

## 5. /docs/ai-context/feature-map.md

Buat tabel mapping fitur utama.

Format:

| Feature | Description | Backend Files | Frontend Files | API | Database/Model | Tests |
|---|---|---|---|---|---|---|

Untuk setiap fitur, isi:

- Nama fitur
- Deskripsi singkat
- File backend terkait
- File frontend terkait
- Endpoint API terkait
- Table/model terkait
- Test terkait

## 6. /docs/ai-context/api-map.md

Buat mapping API.

Format:

| Method | Endpoint | Feature | Controller/Handler | Service | Request | Response | Auth Required |
|---|---|---|---|---|---|---|---|

Untuk setiap endpoint, dokumentasikan:

- HTTP method
- Path endpoint
- Fitur terkait
- File controller/handler
- Service yang dipanggil
- Request body/query params
- Response utama
- Authorization rule

## 7. /docs/ai-context/database.md

Dokumentasikan struktur database atau model.

Isi minimal:

- Daftar table/model utama
- Relasi antar table/model
- Field penting
- Field status/enum
- Table yang dipakai oleh setiap fitur
- Migration/schema file terkait
- Catatan constraint penting

Format tabel:

| Table/Model | Purpose | Important Fields | Related Feature | Related Files |
|---|---|---|---|---|

## 8. /docs/ai-context/testing.md

Dokumentasikan strategi testing:

- Framework test yang digunakan
- Lokasi test
- Cara menjalankan test
- Test penting per fitur
- Pola penamaan test
- Test yang wajib ditambahkan saat mengubah logic tertentu

Format:

| Feature | Test Files | What Is Covered | When To Update |
|---|---|---|---|

## 9. /docs/ai-context/change-recipes.md

Buat panduan kerja untuk jenis perubahan umum.

Minimal buat recipe berikut:

### Recipe: Add New Validation

Isi:
1. Baca feature context terkait
2. Cari service utama dari feature-map
3. Tambahkan validasi di service layer
4. Pastikan controller tidak berisi business logic
5. Tambahkan unit test
6. Pastikan response error mengikuti format existing
7. Jalankan test terkait
8. Update dokumen context jika mapping berubah

### Recipe: Add New API Endpoint

Isi:
1. Baca api-map dan feature context
2. Tambahkan route/controller
3. Tambahkan service method
4. Tambahkan request validation
5. Tambahkan test API
6. Update api-map.md
7. Update feature context

### Recipe: Modify Existing Feature

Isi:
1. Baca dokumen fitur di `/docs/ai-context/features/`
2. Identifikasi file yang boleh diubah
3. Jangan ubah modul di luar scope
4. Ubah logic di layer yang sesuai
5. Tambahkan/update test
6. Pastikan tidak mengubah API contract kecuali diminta
7. Update dokumentasi jika ada perubahan flow

### Recipe: Fix Bug

Isi:
1. Identifikasi fitur dari bug report
2. Baca feature-map
3. Baca dokumen fitur terkait
4. Reproduce dari test jika memungkinkan
5. Perbaiki file paling relevan
6. Tambahkan regression test
7. Jangan refactor unrelated code

## 10. /docs/ai-context/features/<nama-fitur>.md

Untuk setiap fitur utama, buat satu file context.

Format wajib:

```md
# Feature Context: <Nama Fitur>

## Purpose
Jelaskan tujuan fitur.

## Business Flow
Jelaskan alur bisnis fitur dari awal sampai akhir.

## User Roles / Permissions
Jelaskan role yang boleh mengakses fitur ini.

## Main Backend Files
- path/to/controller
- path/to/service
- path/to/model
- path/to/repository

## Main Frontend Files
- path/to/page
- path/to/component
- path/to/hooks
- path/to/api-client

## API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|

## Database / Models
| Table/Model | Usage |
|---|---|

## Validation Rules
- Rule 1
- Rule 2
- Rule 3

## Error Handling
Jelaskan error yang mungkin muncul dan format response-nya.

## Tests
- path/to/test-file

## Safe Modification Scope
File yang biasanya aman diubah untuk fitur ini.

## Do Not Change
File, module, API contract, atau behavior yang tidak boleh diubah tanpa instruksi eksplisit.

## Common Change Scenarios
Contoh:
- Menambah validasi
- Menambah field response
- Mengubah status flow
- Menambah filter/search
```

Batasan penting:
- Jangan menghapus file existing.
- Jangan mengubah business logic aplikasi.
- Jangan melakukan formatting massal pada source code.
- Jangan rename file atau folder aplikasi.
- Jangan membuat asumsi berlebihan. Jika informasi tidak jelas, tulis sebagai `Unknown` atau `Needs verification`.
- Dokumentasi harus berbasis pada kode aktual, bukan spekulasi.

Output yang diharapkan:
1. Buat semua file dokumentasi yang disebutkan.
2. Isi dengan mapping aktual dari kodebase.
3. Pastikan path file yang ditulis benar-benar ada di repo.
4. Setelah selesai, berikan ringkasan:
   - File dokumentasi yang dibuat
   - Fitur yang berhasil dimapping
   - Area yang masih `Needs verification`
   - Rekomendasi next step
```

---

## 2. Prompt Lanjutan: Mengubah Fitur Berdasarkan AI Context

Gunakan prompt ini setelah dokumentasi AI context berhasil dibuat.

```md
Anda adalah AI Engineering Agent yang bekerja berdasarkan dokumentasi AI context project.

Sebelum mengubah kode, wajib baca:
- AGENTS.md
- /docs/ai-context/overview.md
- /docs/ai-context/feature-map.md
- /docs/ai-context/api-map.md
- /docs/ai-context/database.md
- /docs/ai-context/features/<nama-fitur>.md

Task:
<jelaskan perubahan yang diminta>

Scope:
Hanya boleh ubah file berikut:
- <file-1>
- <file-2>
- <file-3>

Constraints:
- Jangan refactor module lain.
- Jangan ubah API contract kecuali diminta.
- Jangan ubah database schema kecuali diminta.
- Jangan ubah behavior fitur lain.
- Ikuti coding rules di `/docs/ai-context/coding-rules.md`.

Acceptance Criteria:
- <kriteria-1>
- <kriteria-2>
- <kriteria-3>

Testing:
- Tambahkan/update test yang relevan.
- Jalankan test terkait jika memungkinkan.
- Laporkan test yang berhasil atau gagal dijalankan.

Setelah selesai:
1. Jelaskan file yang diubah.
2. Jelaskan alasan perubahan.
3. Jelaskan dampak terhadap fitur.
4. Jelaskan test yang ditambahkan/dijalankan.
5. Update dokumen AI context jika ada mapping, API, database, atau flow yang berubah.
```

---

## 3. Versi Singkat untuk Task Harian

Gunakan ini untuk perubahan kecil atau rutin.

```md
Implementasikan perubahan berikut berdasarkan AI context project.

Wajib baca terlebih dahulu:
- AGENTS.md
- /docs/ai-context/feature-map.md
- /docs/ai-context/features/<nama-fitur>.md

Perubahan:
<isi perubahan>

Scope file:
- <file yang boleh diubah>

Larangan:
- Jangan eksplorasi seluruh kodebase kecuali benar-benar diperlukan.
- Jangan ubah file di luar scope.
- Jangan refactor unrelated code.
- Jangan ubah API contract tanpa instruksi eksplisit.

Acceptance Criteria:
- <hasil yang diharapkan>

Testing:
- Tambahkan/update test terkait.
- Laporkan hasilnya.
```

---

## 4. Template Feature Context Manual

Gunakan template ini jika ingin membuat dokumen fitur secara manual.

```md
# Feature Context: <Nama Fitur>

## Purpose
<Jelaskan tujuan fitur>

## Business Flow
1. <Langkah 1>
2. <Langkah 2>
3. <Langkah 3>

## User Roles / Permissions
| Role | Permission |
|---|---|
| Admin | <akses> |
| User | <akses> |

## Main Backend Files
- `<path>`
- `<path>`

## Main Frontend Files
- `<path>`
- `<path>`

## API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/...` | <fungsi> |
| POST | `/api/...` | <fungsi> |

## Database / Models
| Table/Model | Usage |
|---|---|
| `<table>` | <fungsi> |

## Validation Rules
- <rule>
- <rule>

## Error Handling
| Scenario | Error Response |
|---|---|
| <skenario> | <response> |

## Tests
- `<path test>`

## Safe Modification Scope
- `<path>`
- `<path>`

## Do Not Change
- <file/module/behavior yang tidak boleh diubah>

## Common Change Scenarios
- Menambah validasi
- Menambah filter
- Mengubah status flow
- Menambah field response
```

---

## 5. Checklist Implementasi

Gunakan checklist ini setelah agent selesai membuat dokumentasi.

```md
# AI Context Implementation Checklist

## Struktur File
- [ ] `AGENTS.md` dibuat di root project
- [ ] `/docs/ai-context/overview.md` dibuat
- [ ] `/docs/ai-context/architecture.md` dibuat
- [ ] `/docs/ai-context/coding-rules.md` dibuat
- [ ] `/docs/ai-context/feature-map.md` dibuat
- [ ] `/docs/ai-context/api-map.md` dibuat
- [ ] `/docs/ai-context/database.md` dibuat
- [ ] `/docs/ai-context/testing.md` dibuat
- [ ] `/docs/ai-context/change-recipes.md` dibuat
- [ ] `/docs/ai-context/features/` dibuat
- [ ] Minimal 3 fitur utama sudah punya feature context

## Validasi Isi
- [ ] Path file backend valid
- [ ] Path file frontend valid
- [ ] Endpoint API sesuai kode aktual
- [ ] Database/model sesuai kode aktual
- [ ] Test file sesuai kode aktual
- [ ] Area yang belum jelas ditandai `Needs verification`
- [ ] Tidak ada spekulasi yang ditulis sebagai fakta

## Kontrol Agent
- [ ] Ada aturan scope perubahan
- [ ] Ada larangan refactor unrelated code
- [ ] Ada aturan menjaga API contract
- [ ] Ada aturan update test
- [ ] Ada aturan update dokumentasi jika mapping berubah

## Siap Dipakai
- [ ] Prompt task harian sudah tersedia
- [ ] Feature map dapat dipakai untuk menentukan scope
- [ ] API map dapat dipakai untuk menjaga contract
- [ ] Database map dapat dipakai untuk memahami dampak perubahan
```

---

## 6. Rekomendasi Penggunaan

Alur yang disarankan:

1. Jalankan prompt utama pada repository.
2. Review hasil dokumentasi.
3. Tandai bagian yang masih `Needs verification`.
4. Perbaiki mapping fitur yang paling sering diubah.
5. Untuk task berikutnya, gunakan prompt lanjutan atau versi singkat.
6. Setiap ada perubahan struktur kode, update dokumen di `/docs/ai-context/`.

Tujuan akhirnya adalah membuat AI agent bekerja berdasarkan peta konteks yang eksplisit, bukan eksplorasi kodebase mentah dari nol.
