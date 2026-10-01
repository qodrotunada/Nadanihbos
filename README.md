# AR Tubuh & Wajah Kelas

Aplikasi web baru untuk belajar kosakata Arab anggota tubuh dengan AR, lalu mendemonstrasikan pengenalan wajah dan penyimpanan biometrik di Supabase. **Terpisah dari proyek Ular Tangga**; pasang sebagai repo dan proyek Supabase yang berbeda.

- Tab **Kosakata Tubuh** menyediakan 31 kata dari kepala sampai kaki, pencarian, bacaan Latin, dan penanda AR pada bagian yang bisa dilacak. Belajar kosakata tidak memerlukan login dan tidak mengirim data tubuh ke Supabase.
- Kamera dan model Human/TensorFlow.js berjalan di browser. BlazeFace, FaceMesh, FaceRes, MoveNet Lightning, HandTrack, dan HandLandmark Lite disertakan di `public/models/`; bobot model tidak perlu diambil dari CDN.
- Titik pose berasal dari model dan sebagian lokasi seperti dada/perut adalah perkiraan geometri. Rambut, gigi, lidah, punggung, telapak kaki, dan jari kaki ada dalam daftar belajar tanpa penanda AR, karena model ini tidak melacaknya secara andal.
- Pengajar mendaftarkan peserta yang setuju, tiga sampel per orang. Kamera tidak merekam atau menyimpan foto/video; embedding wajah **tetap merupakan data biometrik** dan dikirim terenkripsi lewat HTTPS untuk disimpan di Supabase.
- Supabase Auth hanya untuk pengajar. Function `/api/face` memeriksa token dan `INSTRUCTOR_EMAIL` sebelum mengakses tabel privat. Mahasiswa tidak perlu membuat akun.
- SQL dipisah menjadi `01_tabel.sql`, `02_akses.sql`, dan `03_pencocokan.sql`. Data bisa dihapus melalui aplikasi.

Mulai dari **[README-INSTALASI.md](README-INSTALASI.md)**. Rancangan pertemuan tersedia di **[PANDUAN-KULIAH.md](PANDUAN-KULIAH.md)**.

Teknologi: Vite, TypeScript, Human (TensorFlow.js), deteksi wajah + pose + tangan, Bootstrap Icons, Supabase Auth + PostgreSQL/pgvector, Vercel Functions.

> Demonstrasi ini bukan sistem presensi, keamanan pintu, atau verifikasi identitas resmi. Ambang kemiripan harus diuji dengan peserta yang setuju, perangkat yang akan dipakai, dan pencahayaan kelas. Menggerakkan kepala saat pendaftaran bukan uji anti-pemalsuan yang kuat.
