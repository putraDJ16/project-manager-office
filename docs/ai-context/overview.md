# AI Context Overview

## Project

- Name: Project Manager Office (PMO) SaaS Prototype.
- Purpose: Prototype SaaS manajemen project bergaya ZOHO untuk dashboard PMO, project, task, issue/SLA, master data SDM, notification, audit trail, dan workload.
- Repository shape: monorepo ringan dengan frontend di `CODE/fe` dan backend di `CODE/be`.

## Technology Stack

- Backend: Flask 3, Flask-SQLAlchemy, Flask-Migrate/Alembic, Flask-JWT-Extended, Flask-CORS, Marshmallow, psycopg.
- Database: PostgreSQL untuk runtime lokal/default, SQLite in-memory untuk test via `TestingConfig`.
- Frontend: Vite, React 18, TypeScript, Tailwind CSS, React Router, Radix UI, lucide-react, Recharts, framer-motion.
- Test: pytest untuk backend. Frontend belum punya test runner di `package.json`.
- Deployment/dev: Docker Compose tersedia di root.

## Main Folder Structure

| Path | Purpose |
|---|---|
| `CODE/be/app/api/v1/` | Flask API handlers under `/api/v1` |
| `CODE/be/app/services/` | Backend business logic and validation |
| `CODE/be/app/repositories/` | Query/data access helpers for selected modules |
| `CODE/be/app/models/` | SQLAlchemy models |
| `CODE/be/app/schemas/` | Marshmallow response schemas |
| `CODE/be/tests/` | pytest backend tests |
| `CODE/be/migrations/versions/` | Alembic migrations |
| `CODE/fe/src/app/pages/` | React page modules |
| `CODE/fe/src/app/services/` | Frontend API clients |
| `CODE/fe/src/app/components/` | Shared UI/layout/forms |
| `CODE/fe/src/app/data/` | Frontend session, mock, and master metadata |
| `CODE/fe/src/app/domain/` | Frontend domain types/helpers |
| `CODE/fe/src/styles/` | Global CSS/Tailwind/theme files |

## Entry Points

- Backend app factory: `CODE/be/app/__init__.py`.
- Backend runtime entry: `CODE/be/run.py`.
- Backend route registration: `CODE/be/app/api/v1/__init__.py`.
- Frontend runtime entry: `CODE/fe/src/main.tsx`.
- Frontend root component: `CODE/fe/src/app/App.tsx`.
- Frontend route map: `CODE/fe/src/app/routes.ts`.

## Run Commands

From repository root:

```bash
docker-compose up --build
```

Backend only:

```bash
cd CODE/be
python -m venv .venv
pip install -r requirements.txt
python run.py
```

Frontend only:

```bash
cd CODE/fe
npm install
npm run dev
```

## Test Commands

Backend:

```bash
cd CODE/be
pytest
```

Frontend:

```bash
cd CODE/fe
npm run build
```

No frontend unit/e2e test script is defined in `CODE/fe/package.json`.

## General Conventions

- Backend route prefix is `/api/v1`.
- Successful API response shape is `{ "data": ... }` plus optional `"message"`.
- Error response shape is `{ "message": "..." }` plus optional `"errors"`.
- Backend validation commonly raises `ApiError`.
- Backend response serialization uses Marshmallow schemas in `CODE/be/app/schemas/`.
- Frontend API requests go through `apiRequest` in `CODE/fe/src/app/services/apiClient.ts`.
- Auth session is stored client-side through helpers in `CODE/fe/src/app/data/auth.ts`.
