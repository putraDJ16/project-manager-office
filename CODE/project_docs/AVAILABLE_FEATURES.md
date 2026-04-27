# Daftar Fitur Tersedia (PM SaaS Prototype)

Terakhir diverifikasi dari source code: **10 April 2026**.

## 1. Dashboard dan Navigasi
- **AppShell global** (`src/app/components/layout/AppShell.tsx`)
  - Sidebar modul: Beranda, Tugas, Isu, SDM, Master (Pegawai, Proyek).
  - Topbar global: search, notifikasi, avatar.
- **Home Dashboard** (`/`)
  - KPI cards, burndown chart (Recharts), kapasitas tim, tabel prioritas, activity feed.

## 2. Modul Tugas (`/tugas/list`)
- Switch tampilan: **List**, **Kanban**, **WBS**.
- **Kanban drag-and-drop** antar kolom (status task berubah di state lokal).
- Klik task membuka **Task Detail Panel** (slide panel).
- Di panel detail tersedia UI: metadata, deskripsi, subtasks, komentar.

## 3. Modul Isu dan Bug (`/isu/list`)
- Tabel isu/bug dengan severity, status, SLA, assignee.
- Klik baris isu membuka **Issue Detail Panel**.
- Panel detail menampilkan: SLA warning, metadata, langkah reproduksi, lampiran, log aktivitas, komentar.

## 4. Modul Proyek (`/proyek/list`)
- Switch tampilan: **Grid** dan **List**.
- Kartu/row proyek menampilkan status, anggota tim, dan informasi ringkas proyek.

## 5. Modul SDM - Workload Heatmap (`/sdm/workload`)
- Heatmap beban kerja mingguan per anggota tim.
- Highlight over-allocation.
- Toggle **Simulation Mode** untuk skenario what-if di UI.

## 6. Master Pegawai (`/master/pegawai`)
- Tabel master data pegawai (NIP, nama, email, divisi, jabatan, status).
- Pencarian dan filter status.
- Modal tambah pegawai baru.

## 7. Kondisi Implementasi Saat Ini
- Data masih memakai **mock data lokal** (`src/app/data/mockData.ts`).
- Belum ada integrasi backend/API persisten.
- Beberapa tombol/action masih berupa UI prototype (belum ada proses submit nyata).
