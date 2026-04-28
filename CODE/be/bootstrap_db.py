import os

import psycopg


def ensure_database_exists():
    raw_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/zoho_pm")
    url = raw_url.replace("+psycopg", "")

    if "/" not in url.rsplit("@", 1)[-1]:
        raise RuntimeError("DATABASE_URL tidak valid.")

    database_name = url.rsplit("/", 1)[-1]
    admin_url = f"{url.rsplit('/', 1)[0]}/postgres"

    with psycopg.connect(admin_url, autocommit=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
            exists = cursor.fetchone() is not None
            if not exists:
                cursor.execute(f'CREATE DATABASE "{database_name}"')
                print(f"Database {database_name} berhasil dibuat.")
            else:
                print(f"Database {database_name} sudah ada.")


if __name__ == "__main__":
    ensure_database_exists()
