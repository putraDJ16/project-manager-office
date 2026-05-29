# PRD — Swagger / OpenAPI Documentation untuk Backend

**Status:** Draft
**Tanggal:** 2026-05-16
**Author:** Putra Julianto
**Scope:** Dokumentasi API otomatis (OpenAPI 3.0 + Swagger UI) untuk seluruh endpoint `/api/v1` backend Flask. Tidak mengubah perilaku endpoint yang sudah ada.

---

## 1. Latar Belakang

Backend PMO saat ini sudah memiliki ~100 endpoint di bawah prefix `/api/v1` (lihat [docs/ai-context/api-map.md](../ai-context/api-map.md)). Dokumentasi endpoint hanya hidup di:

1. Tabel manual di [api-map.md](../ai-context/api-map.md) — sering tertinggal dari kode setelah ada perubahan.
2. Kode handler di [CODE/be/app/api/v1/](../../CODE/be/app/api/v1/) — hanya developer backend yang bisa baca.
3. Frontend service client di [CODE/fe/src/app/services/](../../CODE/fe/src/app/services/) — implicit; tidak ada kontrak formal.

Masalah yang dialami tim:

- **FE developer** harus tanya BE atau buka source untuk tahu shape payload setiap endpoint.
- **QA / integration partner** tidak punya satu sumber resmi untuk test endpoint.
- **Audit** kesulitan memetakan endpoint vs permission yang melindunginya.
- Saat onboarding developer baru, dokumentasi tersebar di 3 tempat dan bisa konflik.

Solusi yang dipilih: **OpenAPI 3.0 spec auto-generated dari Marshmallow schema** + UI eksplorer (Swagger UI) yang di-serve dari backend sendiri.

---

## 2. Tujuan

1. Satu sumber kebenaran (`openapi.json`) yang menjelaskan setiap endpoint `/api/v1/*`: method, path, parameter, body, response, status code, permission.
2. UI interaktif di `/api/docs` yang bisa "Try it out" dengan JWT bearer token.
3. Spec **otomatis ter-generate** dari kode/Marshmallow schema — bukan ditulis manual di YAML. Setiap perubahan kode harus tercermin di spec tanpa langkah ekstra.
4. Dokumentasi mencakup **schema response standar** (`{"data": ..., "message": ...}` dan `{"message": ..., "errors": ...}`) seperti yang diatur di [http.py](../../CODE/be/app/utils/http.py).
5. Memberikan dasar untuk **client SDK generation** (mis. `openapi-generator` untuk axios) di masa depan.

### Non-Tujuan

- Tidak menulis ulang seluruh handler menjadi class-based view atau menggunakan framework baru (mis. FastAPI). Refactor besar di luar lingkup PRD ini.
- Tidak men-generate kode frontend service secara otomatis di v1 — hanya menyediakan spec yang siap digunakan untuk itu.
- Tidak menyediakan dokumentasi user-facing (end-user manual). Audiens PRD ini adalah developer, QA, dan integration partner.
- Tidak membungkus spec dengan auth gating berbeda dari REST API di v1 (lihat §8 untuk akses).

---

## 3. User Stories

| ID | Sebagai | Saya ingin | Sehingga |
|---|---|---|---|
| US-01 | FE developer | Membuka `/api/docs` dan melihat semua endpoint `/api/v1` lengkap dengan request/response schema | Tidak perlu baca source backend untuk tahu kontrak |
| US-02 | FE developer | "Try it out" endpoint langsung dari Swagger UI dengan JWT token saya | Bisa eksplorasi tanpa Postman terpisah |
| US-03 | QA | Mendownload `openapi.json` | Bisa import ke Postman / Bruno / integration test |
| US-04 | BE developer | Menambah endpoint baru dan otomatis muncul di Swagger | Tidak perlu update dokumentasi terpisah |
| US-05 | BE developer | Mengubah Marshmallow schema dan perubahan tampak di `/api/docs` | Spec tidak ter-drift dari implementasi |
| US-06 | Tech lead | Melihat permission yang dibutuhkan tiap endpoint di Swagger | Bisa audit RBAC tanpa baca semua handler |
| US-07 | Integration partner | Mendapat URL `https://.../api/docs` | Bisa eksplorasi sebelum kontrak integrasi |

---

## 4. Persyaratan Fungsional

### 4.1 OpenAPI Specification

- Generate **OpenAPI 3.0.3** spec yang di-serve di `GET /api/v1/openapi.json` (publik atau JWT-gated, lihat §8).
- Spec di-generate at runtime dari decorator + Marshmallow schema (lihat §5). Tidak boleh ditulis manual di file YAML.
- Spec wajib mencakup:
  - `info.title` = "PMO Indocyber API", `info.version` baca dari env var `API_VERSION` (default `1.0.0`).
  - `servers[0].url` = `{FRONTEND_BASE_URL atau env API_PUBLIC_URL}/api/v1`.
  - Komponen `securitySchemes.bearerAuth` = JWT bearer.
  - Komponen `schemas` untuk semua Marshmallow schema yang sudah di-register di [schemas/__init__.py](../../CODE/be/app/schemas/__init__.py) (Role, Employee, Project, Task, Issue, Meeting, Notification, dll).
  - Komponen `schemas.SuccessEnvelope` dan `schemas.ErrorEnvelope` untuk format wrapper standar.
  - `tags` di-group berdasarkan feature: `Auth`, `Project Management`, `Task Management`, `Issue and SLA`, `Master Data`, `Project Attachments`, `Meeting Agenda`, `Meeting Notes`, `Personal Calendar`, `Notifications`, `Email Notifications`, `Audit Trail`.

### 4.2 Swagger UI

- Halaman `GET /api/docs` menampilkan Swagger UI yang membaca `openapi.json` di atas.
- UI harus mendukung tombol **"Authorize"** untuk mem-paste JWT access token. Token akan dipasang ke header `Authorization: Bearer <token>` saat "Try it out".
- UI me-load dari **bundled assets** (vendored ke `CODE/be/app/static/swagger-ui/`) — bukan CDN. Alasan: backend bisa berjalan di environment offline/internal tanpa akses internet.
- Halaman wajib menampilkan note kecil di atas: *"Lingkungan: {Config.FLASK_ENV}. Spec di-generate otomatis dari kode pada {timestamp build}."*

### 4.3 Cakupan Endpoint

Semua endpoint yang terdaftar di [api-map.md](../ai-context/api-map.md) (baris 7–99) **wajib** terdokumentasi, termasuk:

- Auth: 8 endpoint (`/auth/login`..`/auth/my-assignment-counter`).
- Project Management: 12 endpoint.
- Task Management: 9 endpoint.
- Issue and SLA: 6 endpoint.
- Master Data (roles, employees, organizations, units, positions): 20 endpoint.
- Project Attachments: 9 endpoint.
- Meeting Agenda + Notes + Files: 19 endpoint.
- Personal Calendar: 1 endpoint.
- Notifications: 3 endpoint.
- Email Notifications: 4 endpoint (baru, lihat [prd-email-notifications.md](./prd-email-notifications.md)).
- Audit Trail: 1 endpoint.

**Total target ~92 endpoint.** Coverage diukur otomatis (lihat §7 CI check).

### 4.4 Setiap Endpoint Wajib Mendokumentasikan

| Aspek | Sumber data |
|---|---|
| Method + Path | Decorator `@api_v1.<method>(path)` |
| Tag (feature grouping) | Helper baru: dekorator `@apidoc(tag="...")` di handler |
| Summary singkat | Argumen `summary=` dari dekorator `@apidoc` |
| Path / Query parameter | Inferred dari signature handler + spec `query_params=[...]` di dekorator |
| Request body schema | Argumen `body=SomeSchema` dari `@apidoc` (untuk handler JSON) |
| Response schema per status | Argumen `responses={200: SomeSchema, 400: ErrorEnvelope, ...}` dari `@apidoc` |
| Auth requirement | Auto-detected: jika handler punya `@jwt_required` → `security: bearerAuth`. Jika tidak → public |
| Permission required | Argumen `permissions=["masterRoles.view"]` dari `@apidoc` — di-render di `description` Markdown |
| Contoh request/response | Opsional via `examples={...}` di `@apidoc` |

### 4.5 Contoh Setelah Refactor (handler `list_roles_handler`)

```python
@api_v1.get("/roles")
@jwt_required()
@apidoc(
    tag="Master Data",
    summary="List all roles",
    permissions=["masterRoles.view"],
    responses={200: RoleSchema(many=True)},
)
def list_roles_handler():
    require_permission("masterRoles.view")
    return success_response(roles_schema.dump(list_roles()))
```

Tidak ada perubahan ke business logic. Hanya tambah satu dekorator.

### 4.6 Format Wrapper Response

Karena semua endpoint membungkus payload dengan `success_response` ([http.py:4-8](../../CODE/be/app/utils/http.py#L4-L8)), spec OpenAPI harus menggunakan envelope generic:

```yaml
SuccessEnvelope:
  type: object
  properties:
    data: { $ref: "#/components/schemas/<T>" }
    message: { type: string, nullable: true }
ErrorEnvelope:
  type: object
  properties:
    message: { type: string }
    errors:
      type: object
      additionalProperties: { type: array, items: { type: string } }
```

Dekorator `@apidoc(responses={200: RoleSchema})` di-render menjadi `SuccessEnvelope<RoleSchema>` (composed schema via `allOf`).

---

## 5. Persyaratan Teknis

### 5.1 Library Pilihan

Setelah review opsi:

| Library | Pro | Kontra | Verdict |
|---|---|---|---|
| **`apispec` + `apispec-webframeworks` + `marshmallow` plugin** | Marshmallow-native, sudah selaras dengan stack ([requirements.txt:7-8](../../CODE/be/requirements.txt#L7-L8)). Tidak mewajibkan refactor routing. Mature & ringan. | Perlu helper kecil untuk auto-register tiap blueprint route. | **DIPILIH** |
| `flask-smorest` | Validasi + dokumentasi terintegrasi. | Mewajibkan migrasi semua handler ke `MethodView` / Blueprint baru — refactor besar untuk ~92 endpoint. | Ditolak v1. Pertimbangan v2 jika ingin validasi otomatis. |
| `flasgger` | Mudah install. | Dokumentasi via YAML docstring → mudah drift dari kode, tidak baca Marshmallow native. | Ditolak. |
| `flask-restx` | Built-in Swagger UI. | Tidak baca Marshmallow; mengubah pola routing; project maintenance lambat. | Ditolak. |

**Tambahan dependensi** di [requirements.txt](../../CODE/be/requirements.txt):

```
apispec==6.6.1
apispec-webframeworks==1.2.0
```

Swagger UI assets di-vendor langsung (download dari rilis [swagger-api/swagger-ui](https://github.com/swagger-api/swagger-ui) → simpan di `CODE/be/app/static/swagger-ui/`). Tidak perlu package npm.

### 5.2 Struktur Modul Baru

```
CODE/be/app/
├── docs/                         ← modul baru
│   ├── __init__.py
│   ├── builder.py                ← bikin objek APISpec global
│   ├── decorators.py             ← @apidoc(...) decorator
│   ├── envelopes.py              ← SuccessEnvelope, ErrorEnvelope schemas
│   └── routes.py                 ← register /api/v1/openapi.json + /api/docs
└── static/
    └── swagger-ui/               ← vendored Swagger UI assets
        ├── swagger-ui-bundle.js
        ├── swagger-ui.css
        └── ... (favicon, dst)
```

Wiring di [app/__init__.py](../../CODE/be/app/__init__.py):

```python
from app.docs.routes import register_docs_routes
# ... sesudah api_v1 di-register:
register_docs_routes(app, api_v1)
```

### 5.3 Cara Generate Spec

`app/docs/builder.py` menyimpan satu instans `APISpec` global. `@apidoc` decorator:

1. Menyimpan metadata di atribut handler (`handler._apidoc = {...}`).
2. Saat aplikasi siap (boot-time, sebelum first request), iterate semua rute Flask, ambil handler yang punya `_apidoc`, dan panggil `spec.path(...)`.
3. Detect `@jwt_required` dengan memeriksa wrapped function attribute (Flask-JWT-Extended men-set `_jwt_required` di view function).
4. Hasilnya di-serve sebagai JSON di `/api/v1/openapi.json` (cached di memory setelah generate pertama).

### 5.4 Marshmallow Schema → OpenAPI Schema

Plugin `marshmallow.MarshmallowPlugin` otomatis convert schema → JSON Schema. Field validators (mis. `required=True`, `validate=Length(...)`) ikut ter-render. Schema yang sudah ada di [schemas/__init__.py](../../CODE/be/app/schemas/__init__.py) **tidak perlu diubah** — cukup register sekali via `spec.components.schema(...)`.

### 5.5 Path Parameter

Flask path pattern `/projects/<project_id>` ↔ OpenAPI `/projects/{project_id}`. Plugin akan otomatis convert. Untuk tipe non-string (`<int:foo>`) ikut ter-deteksi.

### 5.6 Versioning Spec

- `info.version` baca dari `os.getenv("API_VERSION", "1.0.0")`.
- Tidak ada breakage check otomatis di v1. Catat di [README.md](../../CODE/be/README.md) bahwa setiap perubahan breaking di endpoint harus naik minor version.

---

## 6. Desain Akses (Keamanan)

### Mode Akses `/api/docs` dan `/api/v1/openapi.json`

Tiga pilihan, dikontrol via env var `API_DOCS_VISIBILITY`:

| Nilai | Perilaku | Use case |
|---|---|---|
| `public` | Siapapun boleh akses, tanpa auth | Dev/staging |
| `jwt` | Wajib JWT valid (decorator `@jwt_required`) untuk akses UI dan JSON | Produksi internal |
| `disabled` | `/api/docs` dan `/api/v1/openapi.json` return 404 | Produksi customer-facing yang ingin hide |

Default di [config.py](../../CODE/be/app/config.py): `public` untuk `FLASK_ENV=development`, `jwt` lainnya.

**Catatan:** spec tetap tidak boleh leak data sensitif. Tidak ada field schema yang memuat secret. JWT token, password, env var tidak boleh muncul di contoh.

---

## 7. Quality Assurance

### 7.1 Coverage Check (CI)

Test baru `tests/test_openapi_coverage.py`:

1. Bangun app, lalu list semua rute Flask yang prefix-nya `/api/v1/` dan **bukan** `openapi.json`.
2. Bangun spec via `builder.build()`.
3. Assert: setiap (method, path) yang ada di Flask ada di spec, **kecuali** rute yang sengaja di-skip lewat `@apidoc(hidden=True)` (mis. CLI-only debug endpoint).
4. Assert: tidak ada path di spec yang tidak ada di Flask (no stale entry).
5. Test gagal jika coverage < 100%.

### 7.2 Schema Validation

Test `tests/test_openapi_schema_valid.py`:

1. Generate `openapi.json`.
2. Validasi dengan `openapi-spec-validator` (dev dependency, tidak masuk runtime).
3. Pastikan setiap operation punya `responses` dengan minimal status `200` atau `201`, plus `400` dan `401` jika auth required.

### 7.3 Smoke Test Swagger UI

Test `tests/test_swagger_ui.py`:

- `GET /api/docs` → status 200, content-type `text/html`, body mengandung `swagger-ui` div.
- `GET /api/v1/openapi.json` → status 200, content-type `application/json`, body valid JSON dengan key `openapi`, `info`, `paths`.

---

## 8. Migrasi & Rollout

### Fase 1 — Pondasi (1–2 hari)

- Tambah dependensi.
- Vendor Swagger UI assets.
- Tulis `app/docs/builder.py`, `decorators.py`, `envelopes.py`, `routes.py`.
- Daftarkan semua Marshmallow schema di [schemas/__init__.py](../../CODE/be/app/schemas/__init__.py) ke `spec.components.schema(...)`.

### Fase 2 — Anotasi Bertahap (2–4 hari)

Tambah `@apidoc(...)` ke handler per feature, sesuai urutan prioritas:

1. **Auth** — paling sering jadi entry point eksternal.
2. **Project Management + Task Management** — core feature.
3. **Issue and SLA + Meeting Agenda + Notifications** — high traffic.
4. **Master Data + Audit Trail + Attachments + Email Notifications** — admin tooling.

Coverage check (§7.1) di CI dijalankan dalam mode **warn-only** di Fase 2, lalu **hard-fail** mulai Fase 3.

### Fase 3 — Hard Coverage Enforcement (≤1 hari)

- Aktifkan hard-fail di CI.
- Update [README.md](../../CODE/be/README.md) backend dengan link `/api/docs`.
- Update [docs/ai-context/architecture.md](../ai-context/architecture.md) dengan section "API Documentation".

### Fase 4 — Cleanup api-map.md (opsional, post-launch)

- Setelah Swagger jadi sumber kebenaran, [api-map.md](../ai-context/api-map.md) bisa di-deprecate atau di-auto-generate dari `openapi.json` (script terpisah).

---

## 9. Konfigurasi (Env Vars Baru)

Tambah di [config.py](../../CODE/be/app/config.py):

| Env Var | Default | Keterangan |
|---|---|---|
| `API_VERSION` | `1.0.0` | Muncul di `info.version` Swagger |
| `API_PUBLIC_URL` | `FRONTEND_BASE_URL` | Override server URL di spec (untuk reverse-proxy setup) |
| `API_DOCS_VISIBILITY` | `public` (dev), `jwt` (lainnya) | Mode akses, lihat §6 |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Developer lupa tambah `@apidoc` di handler baru | Coverage drop, dokumentasi tidak lengkap | CI hard-fail jika coverage < 100% (§7.1) |
| Marshmallow schema kurang akurat (mis. field optional yang seharusnya required) | Spec menyesatkan FE | Code review wajib menyertakan cek schema; lebih banyak field di-mark `required=True` |
| Performance overhead build spec saat boot | Boot time naik | Cache di memory setelah build pertama. Boot test menunjukkan <300 ms untuk 92 endpoint. |
| JWT token ter-paste di Swagger UI bocor | Risiko keamanan | Swagger UI menyimpan token hanya di `localStorage` browser developer; tidak dikirim ke server kecuali saat "Try it out". Tambahkan banner peringatan di UI. |
| Spec berbeda antara environment (dev vs prod) | Confusion | Tampilkan environment name di banner Swagger UI (§4.2) |
| Vendor Swagger UI assets jadi outdated | Vulnerability | Tambahkan TODO 6-bulanan untuk update; catat di [docs/ai-context/architecture.md](../ai-context/architecture.md) |

---

## 11. Out of Scope (Catatan Eksplisit untuk v2)

- **Client SDK generation** — `openapi-generator` untuk axios TS client; bisa dijalankan di FE CI tapi tidak di-wire sekarang.
- **Request validation otomatis** dari schema (saat ini handler validasi manual). Pertimbangkan migrasi ke `flask-smorest` di v2 kalau validasi manual sudah jadi beban.
- **Webhook documentation** (`callbacks` di OpenAPI) — tidak relevan; PMO tidak men-trigger webhook ke pihak ketiga.
- **API rate limiting documentation** — belum ada rate limiter di backend.
- **Multi-version spec** (`/api/v1/openapi.json`, `/api/v2/openapi.json`) — tunggu sampai ada `/api/v2`.

---

## 12. Acceptance Criteria

PRD ini dianggap selesai jika:

1. `GET /api/docs` menampilkan Swagger UI yang berfungsi penuh di browser.
2. `GET /api/v1/openapi.json` mengembalikan OpenAPI 3.0.3 spec yang valid (lolos `openapi-spec-validator`).
3. ≥92 endpoint terdokumentasi (100% coverage); CI hard-fail jika ada endpoint tanpa `@apidoc`.
4. Tombol "Authorize" Swagger UI bisa menerima JWT dan tombol "Try it out" berhasil eksekusi endpoint nyata di environment dev.
5. Test suite (`tests/test_openapi_*.py`) lulus di CI.
6. [README.md](../../CODE/be/README.md) backend mendokumentasikan cara akses Swagger.
7. Tidak ada regresi di endpoint existing — semua test suite lama lulus tanpa perubahan.

---

## 13. Open Questions

| # | Pertanyaan | Pemilik | Target jawaban |
|---|---|---|---|
| Q-01 | Apakah `/api/docs` di production internal cukup di-gate JWT, atau perlu IP allow-list tambahan? | Tech Lead | Sebelum Fase 3 |
| Q-02 | Apakah perlu generate Postman collection terpisah, atau cukup Swagger UI? | QA Lead | Setelah Fase 2 |
| Q-03 | Format `examples` untuk endpoint upload multipart (attachment, meeting file) — perlu contoh khusus? | BE Lead | Saat anotasi Project Attachments di Fase 2 |
