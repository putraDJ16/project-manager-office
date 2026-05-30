# Feature Context: Auth and Session

## Purpose

Mengelola login, register, refresh token, profil user, onboarding login pertama, ganti password, project milik user, dan assignment counter.

## Business Flow

1. User login atau register dari frontend.
2. Backend memvalidasi credential/data register dan menerbitkan JWT.
3. Frontend menyimpan session dan permission.
4. Jika `onboarding_completed` bernilai false, frontend menampilkan tur onboarding dan mengirim completion saat user selesai/lewati.
5. Protected route memakai permission untuk mengizinkan akses halaman.
6. API authenticated memakai JWT dan permission backend.

## User Roles / Permissions

Semua role dapat login jika user aktif. Akses halaman ditentukan oleh permissions pada role. Register publik membuat user dengan role default aktif yang ditandai di Master Role; jika belum ada flag default, backend fallback ke `Viewer`, `Project Manager`, lalu role aktif pertama.

## Main Backend Files

- `CODE/be/app/api/v1/auth.py`
- `CODE/be/app/services/auth_service.py`
- `CODE/be/app/models/user.py`
- `CODE/be/app/models/role.py`
- `CODE/be/app/models/employee.py`
- `CODE/be/app/utils/permissions.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/auth/LoginPage.tsx`
- `CODE/fe/src/app/App.tsx`
- `CODE/fe/src/app/components/onboarding/OnboardingTour.tsx`
- `CODE/fe/src/app/data/auth.ts`
- `CODE/fe/src/app/services/authApi.ts`
- `CODE/fe/src/app/utils/permissions.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |
| GET | `/api/v1/auth/register-options` | Data master aktif untuk register |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/auth/onboarding/complete` | Menandai onboarding user selesai |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/my-projects` | Project user saat ini |
| GET | `/api/v1/auth/my-assignment-counter` | Counter task/issue aktif user |

## Database / Models

| Table/Model | Usage |
|---|---|
| `users` / `User` | Login identity dan status onboarding |
| `roles` / `Role` | Permission source |
| `employees` / `Employee` | Linked employee profile |
| `projects`, `project_members` | My projects |
| `tasks`, `issues` | Assignment counter |

## Validation Rules

- Login email/password wajib valid.
- User baru default `onboarding_completed = false`; migration menandai user existing sebagai true agar onboarding fokus pada user baru.
- Onboarding selesai dapat ditandai oleh user login sendiri.
- Register wajib nama, email, password, dan password minimal 8 karakter.
- Register `confirm_password` harus cocok.
- Email user harus unik.
- Change password wajib current/new/confirm password.
- New password minimal 8 karakter dan harus berbeda dari password lama.

## Error Handling

Menggunakan `ApiError`. Auth failure umumnya status 401; duplicate email status 409; validasi umum status 400.

## Tests

- `CODE/be/tests/test_auth_api.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/auth.py`
- `CODE/be/app/services/auth_service.py`
- `CODE/be/app/models/user.py`
- `CODE/fe/src/app/pages/auth/LoginPage.tsx`
- `CODE/fe/src/app/components/onboarding/OnboardingTour.tsx`
- `CODE/fe/src/app/services/authApi.ts`
- `CODE/fe/src/app/data/auth.ts`

## Do Not Change

- Jangan ubah JWT claim/session contract tanpa memperbarui frontend dan tests.
- Jangan ubah permission shape tanpa memperbarui role/master data dan route guard.

## Common Change Scenarios

- Menambah field profile.
- Mengubah password policy.
- Menambah register validation.
- Mengubah session timeout behavior.
