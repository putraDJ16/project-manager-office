# Feature Context: Auth and Session

## Purpose

Mengelola login, lupa password dengan OTP email, register dengan OTP email, refresh token, profil user, onboarding login pertama, ganti password dengan OTP email, project milik user, dan assignment counter.

## Business Flow

1. User login atau mengisi form register dari frontend.
2. Jika login gagal karena password salah, frontend menampilkan opsi lupa password; user meminta OTP via `/auth/forgot-password/request-otp`, lalu reset via `/auth/forgot-password/reset`.
3. Untuk register, frontend meminta OTP email melalui `/auth/register/request-otp`, lalu mengirim OTP ke `/auth/register`.
4. Backend memvalidasi OTP register sebelum membuat user dan menerbitkan JWT.
5. Frontend menyimpan session dan permission.
6. Jika `onboarding_completed` bernilai false, frontend menampilkan tur onboarding dan mengirim completion saat user selesai/lewati.
7. Untuk ganti password di profil, user meminta OTP melalui `/auth/change-password/request-otp`, lalu mengirim OTP ke `/auth/change-password`.
8. Protected route memakai permission untuk mengizinkan akses halaman.
9. API authenticated memakai JWT dan permission backend.

## User Roles / Permissions

Semua role dapat login jika user aktif. Akses halaman ditentukan oleh permissions pada role. Register publik membuat user dengan role default aktif yang ditandai di Master Role; jika belum ada flag default, backend fallback ke `Viewer`, `Project Manager`, lalu role aktif pertama.

## Main Backend Files

- `CODE/be/app/api/v1/auth.py`
- `CODE/be/app/services/auth_service.py`
- `CODE/be/app/models/user.py`
- `CODE/be/app/models/account_otp.py`
- `CODE/be/app/models/role.py`
- `CODE/be/app/models/employee.py`
- `CODE/be/app/utils/permissions.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/auth/LoginPage.tsx`
- `CODE/fe/src/app/pages/kustomisasi/ProfilePage.tsx`
- `CODE/fe/src/app/App.tsx`
- `CODE/fe/src/app/components/onboarding/OnboardingTour.tsx`
- `CODE/fe/src/app/data/auth.ts`
- `CODE/fe/src/app/services/authApi.ts`
- `CODE/fe/src/app/utils/permissions.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/forgot-password/request-otp` | Kirim OTP email untuk lupa password |
| POST | `/api/v1/auth/forgot-password/reset` | Reset password publik menggunakan OTP |
| POST | `/api/v1/auth/register/request-otp` | Kirim OTP email untuk register |
| POST | `/api/v1/auth/register` | Register |
| GET | `/api/v1/auth/register-options` | Data master aktif untuk register |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/auth/onboarding/complete` | Menandai onboarding user selesai |
| POST | `/api/v1/auth/change-password/request-otp` | Kirim OTP email untuk perubahan password |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/my-projects` | Project user saat ini |
| GET | `/api/v1/auth/my-assignment-counter` | Counter task/issue aktif user |

## Database / Models

| Table/Model | Usage |
|---|---|
| `users` / `User` | Login identity dan status onboarding |
| `account_otps` / `AccountOtp` | OTP email sementara untuk register, lupa password, dan ganti password |
| `roles` / `Role` | Permission source |
| `employees` / `Employee` | Linked employee profile |
| `projects`, `project_members` | My projects |
| `tasks`, `issues` | Assignment counter |

## Validation Rules

- Login email/password wajib valid.
- Request OTP lupa password memberi respons generik agar tidak membocorkan status email terdaftar.
- Reset password lupa password wajib email, OTP valid, new/confirm password cocok, dan password baru minimal 8 karakter.
- User baru default `onboarding_completed = false`; migration menandai user existing sebagai true agar onboarding fokus pada user baru.
- Onboarding selesai dapat ditandai oleh user login sendiri.
- Register wajib nama, email, password, dan password minimal 8 karakter.
- Register `confirm_password` harus cocok.
- Register wajib OTP valid yang dikirim ke email pendaftar.
- Email user harus unik.
- Change password wajib current/new/confirm password.
- New password minimal 8 karakter dan harus berbeda dari password lama.
- Change password wajib OTP valid yang dikirim ke email user login.
- OTP berlaku 10 menit, hanya sekali pakai, dan maksimal 5 percobaan.

## Error Handling

Menggunakan `ApiError`. Auth failure umumnya status 401; duplicate email status 409; validasi umum status 400.

## Tests

- `CODE/be/tests/test_auth_api.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/auth.py`
- `CODE/be/app/services/auth_service.py`
- `CODE/be/app/models/user.py`
- `CODE/be/app/models/account_otp.py`
- `CODE/fe/src/app/pages/auth/LoginPage.tsx`
- `CODE/fe/src/app/pages/kustomisasi/ProfilePage.tsx`
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
