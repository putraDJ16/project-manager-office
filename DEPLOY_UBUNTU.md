# Panduan Deploy Project ZOHO PMO ke Server Ubuntu

Panduan ini dibuat untuk deploy project ini ke server Ubuntu menggunakan Docker Compose, database PostgreSQL eksternal, Nginx reverse proxy, dan SSL Let's Encrypt.

Struktur project:

- Frontend: `CODE/fe` menggunakan Vite + React.
- Backend: `CODE/be` menggunakan Flask + SQLAlchemy + Alembic migration.
- Compose lokal: `docker-compose.yml`.

> Catatan penting: `docker-compose.yml` yang ada saat ini lebih cocok untuk development lokal karena frontend menjalankan Vite dev server dan database diarahkan ke `host.docker.internal`. Untuk Ubuntu server, gunakan konfigurasi production Compose di bawah atau sesuaikan compose yang ada.

---

## 1. Yang Perlu Disiapkan

### Akses dan infrastruktur

- Server Ubuntu 22.04/24.04 LTS.
- Akses SSH ke server.
- Domain atau subdomain, contoh: `pmo.domainanda.com`.
- DNS `A record` domain diarahkan ke IP public server.
- Repository project sudah ada di GitHub/GitLab atau siap di-upload ke server.

### Spesifikasi minimal server

Untuk server 1 CPU:

- Bisa dipakai untuk internal kecil/prototype.
- RAM minimal 2 GB.
- Wajib gunakan database eksternal.
- Wajib aktifkan swap 2-4 GB.
- Gunakan image production ringan: frontend static Nginx dan backend Gunicorn 1 worker.

Untuk prototype atau internal kecil yang lebih nyaman:

- 2 vCPU.
- RAM 2 GB minimum, 4 GB lebih aman.
- Storage 20 GB minimum.

Untuk penggunaan lebih serius:

- 2-4 vCPU.
- RAM 4-8 GB.
- Storage 40 GB ke atas.
- Backup otomatis database.

### Port yang digunakan

- `80`: HTTP untuk Nginx dan proses generate SSL.
- `443`: HTTPS untuk Nginx.
- `5000`: backend Flask, sebaiknya hanya internal server.
- `5173`: frontend container, hanya internal server dan diteruskan oleh Nginx.
- `5432`: PostgreSQL eksternal, hanya dibuka dari IP server aplikasi jika database berada di server lain.

---

## 2. Login ke Server

Di komputer lokal:

```bash
ssh user@IP_SERVER
```

Update package server:

```bash
sudo apt update
sudo apt upgrade -y
```

Install utilitas dasar:

```bash
sudo apt install -y curl git ufw ca-certificates gnupg nginx dnsutils postgresql-client
```

---

## 3. Setup Firewall

Izinkan SSH, HTTP, dan HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Jika database berada di server terpisah, izinkan akses PostgreSQL hanya dari IP server aplikasi.

---

## 4. Install Docker dan Docker Compose

Install Docker resmi:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Tambahkan user ke group Docker:

```bash
sudo usermod -aG docker $USER
```

Logout lalu login ulang SSH, kemudian cek:

```bash
docker --version
docker compose version
```

---

## 5. Clone Project ke Server

Contoh lokasi deploy:

```bash
  sudo mkdir -p /opt/zoho-pmo
  sudo chown -R $USER:$USER /opt/zoho-pmo
  cd /opt/zoho-pmo
```

Clone repo:

```bash
git clone <URL_REPOSITORY_ANDA> .
```

Jika project dikirim manual, upload folder project ke `/opt/zoho-pmo`.

---

## 6. Optimasi Server 1 CPU

Untuk server 1 CPU, lakukan optimasi ini sebelum menjalankan aplikasi.

### Aktifkan swap

Swap membantu server tetap hidup saat build Docker atau restart service memakan RAM lebih besar dari biasanya.

Jika RAM server 2 GB, gunakan swap 2 GB:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Jika RAM hanya 1 GB, gunakan swap 4 GB:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### Gunakan mode production ringan

Project ini sudah disiapkan dengan file production:

- Backend: `CODE/be/Dockerfile.prod`
- Frontend: `CODE/fe/Dockerfile.prod`
- Frontend Nginx config: `CODE/fe/nginx.prod.conf`

Mode ini lebih cocok untuk 1 CPU karena:

- Backend berjalan dengan Gunicorn `1 worker` dan `2 threads`.
- Frontend tidak menjalankan Vite dev server.
- Frontend dibuild menjadi file static lalu diserve oleh Nginx container.
- Build context Docker diperkecil memakai `.dockerignore`.

### Batasi resource container

Contoh Compose production di bawah sudah memakai batas resource:

- `api`: maksimal sekitar `0.60` CPU dan `768 MB` RAM.
- `web`: maksimal sekitar `0.25` CPU dan `256 MB` RAM.

Jika aplikasi mulai terasa lambat, naikkan server ke 2 CPU lebih efektif daripada menambah worker backend di server 1 CPU.

Saat `docker compose up -d --build`, CPU bisa penuh sementara karena proses build frontend. Jalankan rebuild saat traffic rendah. Jika nanti aplikasinya sering di-update, opsi yang lebih nyaman adalah build image di laptop/CI lalu server hanya pull image.

---

## 7. Buat File Environment

Buat file environment production di root project:

```bash
nano .env.prod
```

Isi contoh:

```env
DATABASE_URL=postgresql+psycopg://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm
JWT_SECRET_KEY=ganti_dengan_random_secret_yang_panjang
CORS_ORIGINS=https://pmo.domainanda.com
FRONTEND_BASE_URL=https://pmo.domainanda.com
API_PUBLIC_URL=https://pmo.domainanda.com
DEFAULT_EMPLOYEE_PASSWORD=GantiPasswordAwal123!
ATTACHMENT_STORAGE_DIR=/app/storage
MAX_CONTENT_LENGTH=26214400

VITE_API_BASE_URL=/api/v1
```

Ganti bagian ini sesuai database yang sudah disiapkan:

- `zoho_user`: username database.
- `ganti_password_database_yang_panjang`: password database.
- `HOST_DATABASE`: IP/hostname database, contoh `10.10.10.20`, `db.domainanda.com`, atau host managed PostgreSQL.
- `5432`: port PostgreSQL.
- `zoho_pm`: nama database.

Jangan gunakan `localhost` di `DATABASE_URL` kecuali database memang berjalan di container yang sama. Dari dalam container `api`, `localhost` berarti container `api`, bukan server database. Gunakan hostname/IP database yang bisa dijangkau dari container.

Jika database eksternal wajib SSL, tambahkan parameter SSL sesuai provider, contoh:

```env
DATABASE_URL=postgresql+psycopg://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm?sslmode=require
```

Buat secret yang kuat:

```bash
openssl rand -hex 32
```

Gunakan hasilnya untuk `JWT_SECRET_KEY`.

---

## 8. Cek Docker Compose Production

Project ini sudah menyediakan file:

```bash
docker-compose.prod.yml
```

Jika file belum ada di server atau Anda ingin membuat ulang, gunakan isi berikut:

```yaml
services:
  api:
    build:
      context: ./CODE/be
      dockerfile: Dockerfile.prod
    container_name: zoho_pmo_api
    env_file:
      - .env.prod
    environment:
      FLASK_ENV: production
      FLASK_APP: run.py
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      CORS_ORIGINS: ${CORS_ORIGINS}
      DEFAULT_EMPLOYEE_PASSWORD: ${DEFAULT_EMPLOYEE_PASSWORD}
      ATTACHMENT_STORAGE_DIR: ${ATTACHMENT_STORAGE_DIR}
      MAX_CONTENT_LENGTH: ${MAX_CONTENT_LENGTH}
    volumes:
      - attachment_storage:/app/storage
    ports:
      - "127.0.0.1:5000:5000"
    cpus: "0.60"
    mem_limit: 768m
    restart: unless-stopped

  web:
    build:
      context: ./CODE/fe
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    container_name: zoho_pmo_web
    depends_on:
      - api
    ports:
      - "127.0.0.1:5173:80"
    cpus: "0.25"
    mem_limit: 256m
    restart: unless-stopped

volumes:
  attachment_storage:
```

Catatan:

- Tidak ada container PostgreSQL di Compose ini. Aplikasi akan konek ke database eksternal melalui `DATABASE_URL`.
- Pastikan host database mengizinkan koneksi dari IP public/private server Ubuntu ini.
- `api` hanya dibuka ke `127.0.0.1:5000`, jadi tidak langsung terbuka ke internet.
- `web` hanya dibuka ke `127.0.0.1:5173`, lalu diakses melalui Nginx.
- Backend production menjalankan migration dulu, lalu menjalankan Gunicorn 1 worker.
- Jika `VITE_API_BASE_URL` berubah, rebuild container `web`.

---

## 9. Build dan Jalankan Container

Sebelum menjalankan container, pastikan database eksternal sudah bisa diakses dari server Ubuntu.

Contoh test koneksi:

```bash
psql "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm" -c "select now();"
```

Jika koneksi gagal, cek hostname, username, password, nama database, firewall database, security group, dan whitelist IP.

Dari root project:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Cek status:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Cek log:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f
```

Cek log backend saja:

```bash
docker logs -f zoho_pmo_api
```

Cek log frontend saja:

```bash
docker logs -f zoho_pmo_web
```

---

## 10. Seed Data Awal

Setelah container hidup, jalankan seed:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api flask --app run.py seed
```

Jika perlu reset database dari nol:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api flask --app run.py reset-db
```

Gunakan `reset-db` dengan hati-hati karena data lama akan dihapus.

---

## 11. Test Akses Lokal di Server

Cek backend:

```bash
curl http://127.0.0.1:5000/api/v1/projects
```

Cek frontend:

```bash
curl -I http://127.0.0.1:5173
```

Jika backend endpoint membutuhkan auth, respons `401` masih menandakan service backend sudah hidup.

---

## 12. Setup Nginx Reverse Proxy

Buat config Nginx:

```bash
sudo nano /etc/nginx/sites-available/zoho-pmo
```

Isi, ganti domain:

```nginx
server {
    listen 80;
    server_name pmo.domainanda.com;

    client_max_body_size 25M;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:5173/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan site:

```bash
sudo ln -s /etc/nginx/sites-available/zoho-pmo /etc/nginx/sites-enabled/zoho-pmo
sudo nginx -t
sudo systemctl reload nginx
```

Jika ada default site yang mengganggu:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Cek dari browser:

```text
http://pmo.domainanda.com
```

---

## 13. Setup SSL HTTPS

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Generate SSL:

```bash
sudo certbot --nginx -d pmo.domainanda.com
```

Cek auto-renew:

```bash
sudo certbot renew --dry-run
```

Setelah SSL aktif, update `.env.prod`:

```env
CORS_ORIGINS=https://pmo.domainanda.com
```

Restart container:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

---

## 14. Cara Update Aplikasi Setelah Ada Perubahan Kode

Masuk ke folder project:

```bash
cd /opt/zoho-pmo
```

Ambil perubahan terbaru:

```bash
git pull
```

Rebuild dan restart:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Cek status dan log:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --tail=100
```

---

## 15. Backup Database

Karena database tidak berjalan di Docker Compose aplikasi, backup dilakukan ke database eksternal langsung atau melalui fitur backup provider database.

Buat folder backup:

```bash
mkdir -p /opt/zoho-pmo/backups
```

Backup manual dari server aplikasi:

```bash
pg_dump "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm" > /opt/zoho-pmo/backups/zoho_pm_$(date +%F_%H-%M).sql
```

Restore:

```bash
psql "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm" < /opt/zoho-pmo/backups/NAMA_FILE_BACKUP.sql
```

Untuk backup otomatis harian, buka crontab:

```bash
crontab -e
```

Tambahkan:

```cron
0 2 * * * pg_dump "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm" > /opt/zoho-pmo/backups/zoho_pm_$(date +\%F_\%H-\%M).sql
```

Jika database memakai managed service seperti RDS, Cloud SQL, Supabase, Neon, atau database server kantor, prioritaskan fitur backup bawaan provider. Tetap lakukan test restore berkala agar backup benar-benar bisa dipakai.

---

## 16. Backup File Attachment

File attachment disimpan di volume Docker `attachment_storage`.

Backup volume ke file `.tar.gz`:

```bash
docker run --rm \
  -v zoho-pmo_attachment_storage:/data \
  -v /opt/zoho-pmo/backups:/backup \
  alpine tar czf /backup/attachment_storage_$(date +%F_%H-%M).tar.gz -C /data .
```

Nama volume bisa berbeda tergantung nama folder project. Cek dengan:

```bash
docker volume ls
```

---

## 17. Perintah Operasional Harian

Lihat container:

```bash
docker ps
```

Restart semua service:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml restart
```

Stop semua service:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml down
```

Start ulang:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Masuk ke shell backend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api sh
```

Tes koneksi ke PostgreSQL eksternal:

```bash
psql "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm"
```

---

## 18. Hardening Production yang Disarankan

Konfigurasi production di panduan ini sudah dibuat lebih ringan untuk server 1 CPU. Untuk menjaga aplikasi tetap stabil, perhatikan ini:

1. Pakai backend production.
   - Gunakan `CODE/be/Dockerfile.prod`.
   - Jangan menaikkan Gunicorn worker di server 1 CPU.
   - Konfigurasi saat ini memakai `1 worker` dan `2 threads`.

2. Pakai frontend static.
   - Gunakan `CODE/fe/Dockerfile.prod`.
   - Jangan menjalankan Vite dev server untuk production.
   - Frontend akan dibuild menjadi file static dan diserve oleh Nginx container.

3. Jangan commit `.env.prod`.
   - Simpan secret hanya di server.

4. Aktifkan monitoring dasar.
   - Minimal gunakan `docker logs`, disk usage alert, dan backup rutin.

5. Batasi akses SSH.
   - Gunakan SSH key.
   - Nonaktifkan password login jika memungkinkan.

6. Amankan database eksternal.
   - Batasi koneksi hanya dari IP server aplikasi.
   - Aktifkan backup otomatis di sisi database.
   - Gunakan user database khusus aplikasi, bukan superuser.

---

## 19. Troubleshooting

### Permission denied saat menjalankan Docker

Contoh error:

```text
permission denied while trying to connect to the docker API at unix:///var/run/docker.sock
```

Penyebabnya user Linux belum punya izin mengakses Docker daemon.

Solusi cepat:

```bash
sudo docker ps
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Solusi permanen agar tidak perlu selalu memakai `sudo`:

```bash
sudo usermod -aG docker $USER
exit
```

Login ulang ke SSH, lalu cek:

```bash
groups
docker ps
```

Pastikan output `groups` memuat `docker`. Jika belum, restart sesi SSH atau jalankan:

```bash
newgrp docker
```

Setelah itu ulangi:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### Container backend restart terus

Cek log:

```bash
docker logs -f zoho_pmo_api
```

Penyebab umum:

- `DATABASE_URL` salah.
- Database eksternal belum bisa diakses dari server aplikasi.
- Migration error.
- Secret atau env belum terbaca.

### Error `Role default belum tersedia`

Contoh respons:

```json
{"message":"Role default belum tersedia. Hubungi administrator."}
```

Artinya database belum punya role aktif untuk user baru. Jalankan seed:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api flask --app run.py seed
```

Lalu coba login dengan akun seed:

```text
Email: admin@zoho.local
Password: Admin123!
```

Jika database sudah pernah terisi sebagian, pastikan kode terbaru sudah ter-deploy lalu rebuild backend:

```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build api
docker compose --env-file .env.prod -f docker-compose.prod.yml exec api flask --app run.py seed
```

Cek role langsung ke database eksternal:

```bash
psql "postgresql://zoho_user:ganti_password_database_yang_panjang@HOST_DATABASE:5432/zoho_pm" \
  -c "select id, name, status from roles order by id;"
```

Minimal harus ada role `Viewer` dengan status `Active`.

### Frontend bisa dibuka, API error

Cek:

```bash
curl -I http://127.0.0.1:5000/api/v1/projects
docker logs -f zoho_pmo_api
```

Pastikan:

- Nginx route `/api/` mengarah ke `127.0.0.1:5000`.
- `CORS_ORIGINS` sesuai domain HTTPS.
- `VITE_API_BASE_URL=/api/v1`.

### Tidak bisa akses `http://IP_SERVER:5173`

Di konfigurasi production, frontend sengaja dibuka hanya ke localhost server:

```yaml
ports:
  - "127.0.0.1:5173:80"
```

Artinya `http://IP_SERVER:5173` tidak bisa diakses langsung dari luar server. Akses aplikasi lewat Nginx:

```text
http://IP_SERVER
```

atau jika domain dan SSL sudah aktif:

```text
https://pmo.domainanda.com
```

Cek dari dalam server:

```bash
curl -I http://127.0.0.1:5173
curl -I http://127.0.0.1
```

Jika benar-benar ingin membuka port `5173` langsung untuk testing sementara, ubah di `docker-compose.prod.yml`:

```yaml
ports:
  - "5173:80"
```

Lalu jalankan:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
sudo ufw allow 5173/tcp
```

Setelah testing, sebaiknya tutup lagi port `5173` dan akses melalui Nginx port `80/443`:

```bash
sudo ufw delete allow 5173/tcp
```

### Error CORS

Pastikan `.env.prod`:

```env
CORS_ORIGINS=https://pmo.domainanda.com
```

Jika memakai beberapa origin:

```env
CORS_ORIGINS=https://pmo.domainanda.com,http://localhost:5173
```

Restart backend:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml restart api
```

### Domain belum bisa dibuka

Cek DNS:

```bash
dig pmo.domainanda.com
```

Cek Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx -f
```

### SSL gagal dibuat

Pastikan:

- DNS sudah mengarah ke IP server.
- Port 80 terbuka.
- Nginx config valid.
- Tidak ada firewall cloud provider yang menutup port 80/443.

---

## 20. Checklist Sebelum Go Live

- DNS domain sudah mengarah ke IP server.
- Firewall hanya membuka port yang diperlukan.
- Docker dan Docker Compose sudah berjalan.
- `.env.prod` sudah dibuat dengan secret kuat.
- Database eksternal sudah dibuat.
- Database eksternal bisa diakses dari server aplikasi.
- `DATABASE_URL` sudah mengarah ke database eksternal.
- Backend container sehat.
- Frontend container sehat.
- Nginx reverse proxy aktif.
- SSL HTTPS aktif.
- Seed data awal sudah dijalankan jika dibutuhkan.
- Backup database sudah diuji.
- Attachment storage sudah memakai volume persistent.
- Login dan fitur utama sudah dites dari browser.

---

## 21. Ringkasan Perintah Deploy

```bash
cd /opt/zoho-pmo

docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

docker compose --env-file .env.prod -f docker-compose.prod.yml ps

docker compose --env-file .env.prod -f docker-compose.prod.yml exec api flask --app run.py seed

sudo nginx -t
sudo systemctl reload nginx
```

Setelah itu akses:

```text
https://pmo.domainanda.com
```
