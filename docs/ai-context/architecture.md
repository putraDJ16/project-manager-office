# Architecture

## Backend Architecture

The backend is a Flask app factory application:

1. `CODE/be/run.py` creates the app with `create_app()`.
2. `CODE/be/app/__init__.py` initializes SQLAlchemy, Alembic migrate, JWT, CORS, API routes, error handlers, hooks, and CLI commands.
3. `CODE/be/app/api/v1/__init__.py` creates the `/api/v1` blueprint and imports API modules.
4. API handlers in `CODE/be/app/api/v1/` parse request data, enforce auth/permission, call services, serialize results, and return `success_response`.
5. Services in `CODE/be/app/services/` hold business rules and database mutation logic.
6. Repositories in `CODE/be/app/repositories/` hold reusable query helpers where present.
7. Models in `CODE/be/app/models/` define SQLAlchemy tables and relationships.

## Frontend Architecture

The frontend is a Vite + React SPA:

1. `CODE/fe/src/main.tsx` renders `App`.
2. `CODE/fe/src/app/App.tsx` owns auth session, theme state, login redirect, protected shell, and route rendering.
3. `CODE/fe/src/app/routes.ts` maps app routes to page components and optional permission modules.
4. `CODE/fe/src/app/components/layout/AppShell.tsx` provides the authenticated app layout.
5. Page components under `CODE/fe/src/app/pages/` call API clients in `CODE/fe/src/app/services/`.
6. Shared UI primitives are in `CODE/fe/src/app/components/ui/`.

## Request Flow

Typical authenticated flow:

1. User logs in from `CODE/fe/src/app/pages/auth/LoginPage.tsx`.
2. `CODE/fe/src/app/services/authApi.ts` posts to `/api/v1/auth/login`.
3. Backend `CODE/be/app/api/v1/auth.py` calls `auth_service.login`.
4. JWT access/refresh tokens and role permissions are returned in `data`.
5. Frontend stores session via `CODE/fe/src/app/data/auth.ts`.
6. Protected pages call service modules such as `projectApi`, `taskApi`, `issueService`, or `masterApi`.
7. Backend handlers require `jwt_required()` and permission helpers before calling services.
8. Backend serializes SQLAlchemy objects with Marshmallow schemas and wraps them in `success_response`.

## Error Handling

- App-level error handlers live in `CODE/be/app/__init__.py`.
- Business errors use `ApiError(message, status_code, errors)`.
- HTTP exceptions are converted to `error_response`.
- Unhandled exceptions become status 500 with the exception string.
- JWT unauthorized/invalid token callbacks return status 401 with message.
- Frontend `apiRequest` parses error payloads and throws `ApiRequestError`; it also attempts `/auth/refresh` on 401 when a refresh token exists.

## Authentication And Authorization

- JWT is configured in `CODE/be/app/config.py`.
- Login/register/change password/profile logic is in `CODE/be/app/services/auth_service.py`.
- Backend permission helpers are in `CODE/be/app/utils/permissions.py`.
- Permission modules include `dashboard`, `tasks`, `issues`, `workload`, `masterEmployees`, `masterProjects`, `projectPhases`, `projectMembers`, `projectTasks`, `projectTaskComments`, `projectIssues`, `projectAttachments`, `masterRoles`, `masterOrganizations`, `masterOrganizationUnits`, and `masterPositions`.
- Project-scoped access can be granted by module permission or by project membership/manager checks in `user_is_project_member`.
- Frontend route visibility uses `hasPermission` in `CODE/fe/src/app/utils/permissions.ts`.

## Environment Configuration

- Backend config file: `CODE/be/app/config.py`.
- Important backend env vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `ATTACHMENT_STORAGE_DIR`, `MAX_CONTENT_LENGTH`, `DEFAULT_EMPLOYEE_PASSWORD`, `JWT_ACCESS_TOKEN_EXPIRES_MINUTES`, `SESSION_TIMEOUT_MINUTES`.
- Frontend API base: `VITE_API_BASE_URL`, defaulting to `/api/v1`.
- Frontend proxy target is configured by `VITE_PROXY_TARGET` in Docker Compose and Vite config.

## Cross-Module Dependencies

- Tasks depend on projects and phases.
- Issues depend on projects and SLA rules.
- Project detail depends on members, phases, tasks, holidays, attachments, and manager employee data.
- Employees depend on roles and master reference values for organization/unit/position.
- Users may link to roles and employees.
- Notifications are created from assignment-related flows such as project member and issue assignment.
- Audit trails are captured globally in an `after_request` hook.
