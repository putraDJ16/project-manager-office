Folder ini disiapkan untuk artefak Alembic (`flask db init/migrate/upgrade`).

Langkah awal:

1. `python -m venv .venv`
2. **Aktifkan virtual environment:**
   - Windows: `.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`
3. `pip install -r requirements.txt`
4. salin `.env.example` menjadi `.env`
5. `flask --app run.py db init` (sekali saja, jika folder migration belum diinisialisasi)
6. `flask --app run.py db migrate -m "init schema"`
7. `flask --app run.py db upgrade`
8. `flask --app run.py seed`

### Menjalankan Server (Development Lokal)

Untuk menjalankan server di lingkungan lokal tanpa Docker:
```bash
python run.py
```
*(Server akan berjalan pada http://localhost:5000)*

### Swagger / OpenAPI

Backend menyediakan dokumentasi API otomatis:

- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/openapi.json`

Konfigurasi terkait:

- `API_VERSION` default `1.0.0`
- `API_PUBLIC_URL` default mengikuti `FRONTEND_BASE_URL`
- `API_DOCS_VISIBILITY`: `public`, `jwt`, atau `disabled`

### Menjalankan Server (Melalui Docker)
Alternatif yang lebih mudah, jika Anda menggunakan Docker, kembali ke folder paling luar (root `Project ZOHO`) dan jalankan:
```bash
docker-compose up --build
```
