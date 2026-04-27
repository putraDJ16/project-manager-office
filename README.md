# Project Manager Office (PMO) SaaS Prototype

This project is a PMO SaaS prototype inspired by ZOHO, featuring a modern frontend and a Flask backend.

## Project Structure

- `CODE/fe`: Frontend (Vite + React + Tailwind CSS)
- `CODE/be`: Backend (Flask + SQLAlchemy)
- `project_docs`: Documentation and implementation plans
- `stitch_task_md_pack`: Design system and task guides

## Deployment to Vercel (Frontend)

To deploy the frontend to Vercel:

1. Connect this GitHub repository to Vercel.
2. In the project settings, set the **Root Directory** to `CODE/fe`.
3. Vercel will automatically detect the **Vite** framework preset.
4. Ensure the build command is `npm run build` and output directory is `dist`.
5. Add any necessary environment variables.

## Local Development

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
