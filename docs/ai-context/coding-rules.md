# Coding Rules

## Backend

- API files are named by resource under `CODE/be/app/api/v1/`.
- Service files are named `<feature>_service.py` under `CODE/be/app/services/`.
- Repository files are named `<feature>_repository.py` under `CODE/be/app/repositories/`.
- SQLAlchemy models use class names in PascalCase and `__tablename__` in snake_case plural form.
- Marshmallow schemas live in `CODE/be/app/schemas/` and are exported from `CODE/be/app/schemas/__init__.py`.
- Business logic and validation belong in services, not API handlers.
- API handlers should parse request input, enforce auth/permission, call a service, serialize response, and return a helper response.
- Use `ApiError` for domain validation and permission errors that are not handled by decorators.
- Use `success_response` for JSON success payloads.
- Use `error_response` only in central error handling unless adding a new low-level error pathway.
- Keep existing API response contract: success payload is wrapped in `data`; error payload uses `message` and optional `errors`.
- Add or update Alembic migrations when schema changes are explicitly requested.

## Frontend

- API calls belong in `CODE/fe/src/app/services/`.
- Page-level UI belongs in `CODE/fe/src/app/pages/`.
- Shared layout belongs in `CODE/fe/src/app/components/layout/`.
- Shared UI primitives belong in `CODE/fe/src/app/components/ui/`.
- Domain types/helpers belong in `CODE/fe/src/app/domain/`.
- Route definitions belong in `CODE/fe/src/app/routes.ts`.
- Respect `CODE/fe/AGENTS.md`: create actions need loading state, visible backend messages, disabled submit/close controls while loading, submit-based search, and clear buttons for search fields.

## Imports And Style

- Backend imports use absolute `app.*` imports.
- Frontend imports are mixed relative imports and alias `@/` where already used; follow local file style.
- Do not introduce a new state library or data fetching framework unless explicitly requested.
- Do not move business rules from backend services into frontend pages.

## Validation Locations

- Backend request/business validation: services in `CODE/be/app/services/`.
- Backend permission validation: decorators/helpers in `CODE/be/app/utils/permissions.py` or feature-local helpers in API files.
- Frontend form validation: page/form components for UX only; backend remains source of truth.

## Database Query Locations

- Prefer repository modules when the feature already has one.
- Some existing services query models directly; follow the current module style for small changes.
- Do not create broad repository refactors for a local feature change.

## Do Not Do

- Do not refactor unrelated modules.
- Do not change API paths or response shapes unless requested.
- Do not alter permission semantics without updating `feature-map.md`, `api-map.md`, and relevant feature context.
- Do not add schema migrations for frontend-only changes.
- Do not add frontend-only mocks as replacements for live API behavior unless the task explicitly asks for fallback/mock behavior.
- Do not delete existing files as part of documentation/context work.
