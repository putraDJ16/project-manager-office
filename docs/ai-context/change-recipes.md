# Change Recipes

## Recipe: Add New Validation

1. Read the related feature context in `/docs/ai-context/features/`.
2. Find the main service from `feature-map.md`.
3. Add validation in the service layer.
4. Keep controller/API handler free of business logic.
5. Add or update unit/API tests.
6. Ensure error response follows existing `ApiError` and `error_response` format.
7. Run related tests.
8. Update context docs if mapping, API, database, or flow changes.

## Recipe: Add New API Endpoint

1. Read `api-map.md` and the related feature context.
2. Add route/controller in the relevant `CODE/be/app/api/v1/` file.
3. Add service method in `CODE/be/app/services/`.
4. Add request validation in service layer.
5. Add API test in `CODE/be/tests/`.
6. Update `docs/ai-context/api-map.md`.
7. Update `docs/ai-context/feature-map.md` and the feature context file.

## Recipe: Modify Existing Feature

1. Read the feature context in `/docs/ai-context/features/`.
2. Identify files allowed by the feature map and safe modification scope.
3. Avoid modules outside scope.
4. Change logic in the correct layer.
5. Add or update tests.
6. Keep API contract unchanged unless the task explicitly asks otherwise.
7. Update documentation if flow, API, database, permissions, or file mapping changes.

## Recipe: Fix Bug

1. Identify the feature from the bug report.
2. Read `feature-map.md`.
3. Read the related feature context.
4. Reproduce with a test when possible.
5. Fix the most relevant file.
6. Add regression test.
7. Do not refactor unrelated code.

## Recipe: Add Database Field

1. Confirm user explicitly requested schema change.
2. Read `database.md` and related feature context.
3. Update SQLAlchemy model.
4. Add Alembic migration in `CODE/be/migrations/versions/`.
5. Update Marshmallow schema if field is exposed by API.
6. Update service validation/default handling.
7. Update frontend API types and UI only if field is user-facing.
8. Add/update tests.
9. Update `database.md`, `api-map.md`, `feature-map.md`, and feature context.

## Recipe: Frontend Page Change

1. Read related feature context and `CODE/fe/AGENTS.md`.
2. Locate page/component and API client from `feature-map.md`.
3. Keep API contract unchanged unless requested.
4. Preserve loading, disabled state, and visible backend message patterns.
5. Run `npm run build` if TypeScript or imports changed.
6. Update context docs if page, API client, or flow mapping changes.
