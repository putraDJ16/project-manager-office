# Project Manager Office (PMO) SaaS Prototype

This project is a PMO SaaS prototype inspired by ZOHO, featuring a modern frontend and a Flask backend.

## Project Structure

- `CODE/fe`: Frontend (Vite + React + Tailwind CSS)
- `CODE/be`: Backend (Flask + SQLAlchemy)
- `project_docs`: Documentation and implementation plans
- `stitch_task_md_pack`: Design system and task guides

## Frontend Design System

- Component library: `CODE/fe/src/COMPONENT_LIBRARY.md`
- Design tokens: `CODE/fe/src/DESIGN_TOKENS.md`
- Implementation plan: `CODE/fe/DESIGN_SYSTEM_IMPROVEMENT_PLAN.md`

## Deployment to Vercel (Frontend)

To deploy the frontend to Vercel:

1. Connect this GitHub repository to Vercel.
2. **IMPORTANT**: In the project settings, set the **Root Directory** to `CODE/fe`. 
   - *If you don't do this, you will get a 404 NOT_FOUND error because Vercel won't find the `index.html` file.*
3. Vercel will automatically detect the **Vite** framework preset.
4. Ensure the build command is `npm run build` and output directory is `dist`.
5. Add any necessary environment variables.

## Troubleshooting 404 Errors

If you see a `404: NOT_FOUND` error after deploying:
1. **Check Root Directory**: Ensure it is set to `CODE/fe` in Vercel Project Settings > General.
2. **Client-side Routing**: I have added a `vercel.json` in `CODE/fe` to handle React Router rewrites. This ensures that refreshing the page doesn't cause a 404.

## Setup with Docker Compose (Recommended for Local Dev)

The easiest way to run the entire stack (PostgreSQL, Flask Backend, Vite Frontend) locally is using Docker Compose:

1. Ensure you have Docker and Docker Compose installed.
2. Run the following command in the root directory:
```bash
docker-compose up --build
```
3. The Vite frontend will be available at http://localhost:5173
4. The Flask backend will be available at http://localhost:5000
5. The backend connects to local PostgreSQL on port 5434.

*Note: Changes made to `CODE/fe` and `CODE/be` will automatically hot-reload.*

## Local Development (Without Docker)

### Frontend
```bash
cd CODE/fe
npm install
npm run dev
```

### Backend
```bash
cd CODE/be
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python run.py
```

## Session Timeout

Session timeout defaults to 480 minutes (8 hours). Set the same value for frontend and backend deployments:

- Backend: `SESSION_TIMEOUT_MINUTES=480`
- Frontend: `VITE_SESSION_TIMEOUT_MINUTES=480`

Access tokens are short-lived by default. You can tune them separately with `JWT_ACCESS_TOKEN_EXPIRES_MINUTES=15`.


## Email Notifications

The backend uses a DB-backed email outbox. API requests only enqueue rows; SMTP delivery is handled by the dispatcher/worker so user-facing requests do not wait for email sending.

Environment variables:

- `MAIL_ENABLED=false` toggles real SMTP delivery. Keep `false` for tests/dev when you only want outbox rows.
- `MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=587`, `MAIL_USE_TLS=true` configure SMTP.
- `MAIL_USERNAME` and `MAIL_PASSWORD` must come from `.env` or deployment secrets. Do not commit Gmail App Passwords.
- `MAIL_FROM_NAME=PMO Indocyber`, `MAIL_FROM_ADDRESS=agenda@indocyber.id` control sender identity.
- `FRONTEND_BASE_URL=http://localhost:5173` is used for CTA links in email templates.
- `MAIL_TEST_RECIPIENT` redirects all queued email to one recipient for staging tests.

Run the worker manually from `CODE/be`:

```bash
flask email-worker
```

For one-shot/local validation, keep `MAIL_ENABLED=false`, trigger an assignment or meeting invite, then inspect `/api/v1/admin/email-outbox` with an admin user.
