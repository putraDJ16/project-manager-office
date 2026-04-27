Folder ini disiapkan untuk artefak Alembic (`flask db init/migrate/upgrade`).

Langkah awal:

1. `python -m venv .venv`
2. `pip install -r requirements.txt`
3. salin `.env.example` menjadi `.env`
4. `flask --app run.py db init` (sekali saja, jika folder migration belum diinisialisasi)
5. `flask --app run.py db migrate -m "init schema"`
6. `flask --app run.py db upgrade`
7. `flask --app run.py seed`
