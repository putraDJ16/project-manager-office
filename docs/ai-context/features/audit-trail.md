# Feature Context: Audit Trail

## Purpose

Mencatat aktivitas request dan menyediakan API listing audit trail.

## Business Flow

1. Flask `after_request` hook memanggil audit trail service.
2. Service menyaring/masking payload sensitif.
3. Service dapat menerima `g.audit_note` dari endpoint untuk menyimpan konteks perubahan domain (contoh perubahan status issue).
4. Audit record disimpan.
5. Frontend profile dapat mengambil riwayat aktivitas user.

## User Roles / Permissions

`GET /audit-trails` hanya memakai JWT. Needs verification: tidak ditemukan permission module khusus untuk audit listing.

## Main Backend Files

- `CODE/be/app/__init__.py`
- `CODE/be/app/api/v1/audit_trails.py`
- `CODE/be/app/services/audit_trail_service.py`
- `CODE/be/app/models/audit_trail.py`
- `CODE/be/app/schemas/audit_trail_schema.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/kustomisasi/ProfilePage.tsx`
- `CODE/fe/src/app/services/auditTrailApi.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/audit-trails` | Paginated/filterable audit trail list |

## Database / Models

| Table/Model | Usage |
|---|---|
| `audit_trails` / `AuditTrail` | Request audit records |
| `users` / `User` | Optional user relationship |

## Validation Rules

- `page` minimal 1.
- `per_page` must be between 1 and 100.
- Filters: `user_id`, `method`, `path`, `status_code`.

## Error Handling

Invalid pagination uses `ApiError`. Global hook should not break regular response flow; verify before changing.

## Tests

- `CODE/be/tests/test_audit_trails_api.py`

## Safe Modification Scope

- `CODE/be/app/services/audit_trail_service.py`
- `CODE/be/app/api/v1/audit_trails.py`
- `CODE/fe/src/app/services/auditTrailApi.ts`
- Profile activity section in `CODE/fe/src/app/pages/kustomisasi/ProfilePage.tsx`

## Do Not Change

- Jangan log password/token/sensitive payload.
- Jangan membuat audit listing publik.

## Common Change Scenarios

- Menambah filter audit.
- Mengubah masking field.
- Mengubah activity label di frontend.
