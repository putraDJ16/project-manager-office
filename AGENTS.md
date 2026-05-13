# AI Agent Instructions

Repository ini memakai dokumentasi konteks AI di `/docs/ai-context/` sebagai peta kerja utama. Sebelum mengubah kode, agent wajib membaca dokumen yang relevan dan menjaga scope perubahan tetap kecil.

## Required Reading

- Baca `/docs/ai-context/overview.md`.
- Baca `/docs/ai-context/feature-map.md`.
- Baca dokumen fitur terkait di `/docs/ai-context/features/`.
- Untuk perubahan API, baca `/docs/ai-context/api-map.md`.
- Untuk perubahan database/model, baca `/docs/ai-context/database.md`.
- Untuk perubahan test atau business logic, baca `/docs/ai-context/testing.md`.

## Scope Rules

- Hanya ubah file yang relevan dengan fitur yang diminta.
- Jangan refactor modul lain tanpa instruksi eksplisit.
- Jangan rename file/folder aplikasi tanpa instruksi eksplisit.
- Jangan melakukan formatting massal pada source code.
- Jaga API contract existing kecuali user meminta perubahan contract.
- Tambahkan atau perbarui test jika business logic berubah.
- Update dokumen AI context jika mapping file, API, database, permission, atau flow fitur berubah.

## Backend Rules

- Business logic berada di `CODE/be/app/services/`.
- API handler berada di `CODE/be/app/api/v1/` dan sebaiknya tetap tipis.
- Query database reusable berada di `CODE/be/app/repositories/` jika sudah ada pattern repository untuk fitur tersebut.
- Error aplikasi gunakan `ApiError` dari `CODE/be/app/utils/exceptions.py`.
- Response JSON gunakan `success_response` dan `error_response` dari `CODE/be/app/utils/http.py`.
- Permission gunakan helper di `CODE/be/app/utils/permissions.py`.

## Frontend Rules

- API client berada di `CODE/fe/src/app/services/`.
- Route halaman berada di `CODE/fe/src/app/routes.ts`.
- Session dan auth state berada di `CODE/fe/src/app/data/auth.ts` dan `CODE/fe/src/app/App.tsx`.
- Ikuti working memory frontend di `CODE/fe/AGENTS.md`.
- Jangan menaruh business rule backend di frontend selain validasi UX ringan.

## Unknowns

- Jika informasi belum jelas dari kode aktual, tulis sebagai `Needs verification`.
- Jangan menulis spekulasi sebagai fakta.
