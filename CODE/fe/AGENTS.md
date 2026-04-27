# Frontend Working Memory

- Untuk setiap aksi tambah data (create) di frontend, wajib tampilkan state loading saat request berjalan.
- Tampilkan feedback hasil aksi menggunakan message dari backend untuk kondisi sukses maupun gagal, dan pastikan notifikasi terlihat jelas oleh user.
- Tombol submit dan kontrol penutup modal harus dinonaktifkan saat loading agar tidak terjadi submit ganda.
- Untuk fitur pencarian, request/filter dijalankan saat submit (Enter/tombol Cari), bukan setiap ketikan.
- Setiap field pencarian wajib memiliki tombol clear (`X`) yang mereset input dan hasil pencarian ke kondisi tanpa filter.
