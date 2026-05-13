# Feature Context: Notifications

## Purpose

Menampilkan dan mengelola notifikasi in-app untuk assignment project/task/issue.

## Business Flow

1. Backend membuat notification ketika flow assignment tertentu terjadi.
2. Frontend shell/page mengambil notifications.
3. User membaca notification atau menandai semua sudah dibaca.

## User Roles / Permissions

Endpoint notification hanya membutuhkan JWT dan memakai user id dari token. Tidak ditemukan permission module khusus.

## Main Backend Files

- `CODE/be/app/api/v1/notifications.py`
- `CODE/be/app/services/notification_service.py`
- `CODE/be/app/repositories/notification_repository.py`
- `CODE/be/app/models/notification.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/kustomisasi/NotificationsPage.tsx`
- `CODE/fe/src/app/components/layout/AppShell.tsx`
- `CODE/fe/src/app/services/notificationApi.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/notifications` | List notifications and unread count |
| PATCH | `/api/v1/notifications/<notification_id>/read` | Mark one notification read |
| POST | `/api/v1/notifications/read-all` | Mark all notifications read |

## Database / Models

| Table/Model | Usage |
|---|---|
| `notifications` / `Notification` | Notification record |
| `users` / `User` | Target user |

## Validation Rules

- Notification actions use current token user.
- Mark read must find notification owned by current user.
- `unread_only` query accepts truthy strings such as `1`, `true`, `yes`.

## Error Handling

Missing notification returns 404 via `ApiError`.

## Tests

- `CODE/be/tests/test_notifications_api.py`

## Safe Modification Scope

- `CODE/be/app/api/v1/notifications.py`
- `CODE/be/app/services/notification_service.py`
- `CODE/be/app/repositories/notification_repository.py`
- `CODE/fe/src/app/pages/kustomisasi/NotificationsPage.tsx`
- `CODE/fe/src/app/services/notificationApi.ts`

## Do Not Change

- Jangan mengirim notification ke user lain tanpa checking target resolution.
- Jangan ubah read ownership behavior.

## Common Change Scenarios

- Menambah event notification.
- Menambah filter notification.
- Mengubah unread badge behavior.
