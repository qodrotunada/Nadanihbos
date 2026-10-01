# Instalasi AR Tubuh & Wajah Kelas — dari nol sampai dipakai

Anda memasang **proyek baru**. Jangan menggabungkan folder ini dengan repo Ular Tangga; aplikasi ini dirancang sebagai modul praktik yang lebih kecil.

## Persiapan

- Akun Supabase, GitHub, dan Vercel; ponsel/laptop berkamera.
- Buat **proyek Supabase baru** khusus kelas. Tentukan satu alamat email pengajar (contoh: `ari@gmail.com` jika itu akun Anda), dan buat sandi sendiri. Jangan memasukkan sandi ke SQL, repo, atau ZIP.
- Jalankan aplikasi dari HTTPS (Vercel) atau `localhost` agar browser dapat meminta izin kamera.

## 1. Supabase — query terpisah

Di proyek Supabase baru, buka **SQL Editor → New query**. Jalankan file satu demi satu, masing-masing di tab query baru. **Jangan gabungkan**:

1. `supabase/01_tabel.sql` → ekstensi pgvector dan tiga tabel: `face_profiles`, `face_samples`, `face_events`.
2. `supabase/02_akses.sql` → RLS aktif, akses langsung dari browser ditutup; server Vercel memperoleh akses sesuai kunci server.
3. `supabase/03_pencocokan.sql` → fungsi pencarian embedding untuk server.

Tunggu setiap tab menampilkan **Success** sebelum lanjut. Bila gagal, hentikan dan periksa error pada tab tersebut; jangan mengulangi seluruh berkas pada proyek yang sudah memiliki tabel dengan struktur berbeda.

## 2. Buat akun pengajar

Buka **Authentication → Users → Add user** pada proyek yang sama. Buat pengguna dengan email pengajar serta kata sandi pilihan Anda; aktifkan konfirmasi email atau selesaikan undangan sesuai tampilan Dashboard. Aplikasi tidak menyediakan menu pendaftaran peserta.

## 3. Unggah situs ke GitHub dan Vercel

Ekstrak ZIP final. Isi folder `ar-wajah-kelas/` (termasuk `api/`, `src/`, `public/models/`, dan `package-lock.json`) dijadikan **root repo** GitHub. Folder `node_modules/`, `dist/`, dan `.env` tidak diunggah.

Import repo di Vercel. Pengaturan: **Framework Vite**, **Node.js 22.x**, **Build Command `npm run build`**, **Output Directory `dist`**. File `vercel.json` sudah menetapkan framework, build, dan output. Vercel otomatis mendeteksi `api/face.ts` sebagai Function.

### Environment Variables di Vercel

Jika menggunakan integrasi otomatis Supabase ↔ Vercel, beberapa variabel berikut sudah ada; pastikan nilainya **terisi dan tidak Needs Attention**:

| Nama | Kegunaan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase untuk browser (atau `VITE_SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci publik untuk login (atau `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `SUPABASE_URL` | URL Supabase untuk Function |
| `SUPABASE_PUBLISHABLE_KEY` | Kunci publik untuk Function; jika proyek lama, boleh `SUPABASE_ANON_KEY` |
| `SUPABASE_SECRET_KEY` | Kunci rahasia **hanya server**; alternatif proyek lama: `SUPABASE_SERVICE_ROLE_KEY` |
| `INSTRUCTOR_EMAIL` | Email pengajar yang dibuat di Authentication → Users, contoh `ari@gmail.com` |

Jika integrasi otomatis tidak ada, salin nama variabel di atas dan isi dari pengaturan proyek Supabase. Awalan `NEXT_PUBLIC_`/`VITE_` hanya untuk URL dan publishable key. **Jangan memberi awalan publik pada secret key.**

Deploy/redeploy setelah mengatur variabel. Pengubahan Environment Variables tidak mengubah deployment lama sampai deploy ulang.

## 4. Uji fungsi secara berurutan

1. Buka URL produksi Vercel memakai HTTPS. Tekan **Nyalakan Kamera** dan izinkan kamera. Pada pemakaian pertama, tunggu model wajah, pose, dan tangan selesai dimuat. Tidak perlu login untuk belajar kosakata.
2. Buka **Kosakata Tubuh**, pilih kata seperti **bahu**, **telapak tangan**, atau **lutut**. Masukkan bagian tersebut ke dalam bingkai; titik dan tulisan Arab akan mengikutinya. Anda dapat mencari 31 kosakata; kata bertanda **Pelajaran** tidak memiliki titik AR karena posisi visualnya tidak dapat diketahui secara andal.
3. Klik **Masuk Pengajar** dan gunakan email/sandi yang dibuat di Supabase. Bila muncul "Hanya akun pengajar", periksa `INSTRUCTOR_EMAIL` dan konfirmasi email.
4. Minta persetujuan sukarelawan. Buka **Daftarkan Wajah**, isi namanya, lalu ambil **3 sampel** dengan arah wajah sedikit berbeda. Centang persetujuan dan tekan **Simpan ke Supabase**.
5. Buka **Kamera AR**, arahkan satu wajah yang telah didaftarkan dan tekan **Kenali Wajah Sekarang**. Label mengikuti wajah beberapa detik. Ambang kemiripan tersedia sebagai slider untuk demonstrasi; kemiripan bukan bukti identitas.
6. Buka **Data Kelas** untuk melihat peserta dan riwayat. Anda juga dapat melihat baris di Supabase Table Editor; klik ikon tempat sampah untuk menghapus data sukarelawan.

## Pengembangan lokal

Jalankan `npm ci`, lalu `npm run dev`. Kamera dan seluruh kosakata anggota tubuh dapat dicoba di `http://localhost:5173`; untuk login, penyimpanan, dan `/api/face`, jalankan melalui `vercel dev` dengan proyek dan environment variables yang telah terhubung, atau uji di deployment Vercel. Buka `.env.example` sebagai daftar variabel; jangan commit `.env` yang berisi kunci server. Bila sebelumnya sudah memasang versi 1, **ketiga query SQL tidak berubah dan tidak perlu dijalankan ulang**; deploy saja source dan model baru.

## Pemeriksaan bila terjadi kendala

- **Kamera hitam / tidak diizinkan:** buka URL HTTPS, izinkan kamera di browser/OS, tutup aplikasi lain yang memegang kamera, dan pastikan gambar wajah cukup terang.
- **Model gagal dimuat:** pastikan 12 berkas `public/models/` ikut terunggah: enam pasangan `.json` dan `.bin` untuk `blazeface`, `facemesh`, `faceres`, `movenet-lightning`, `handtrack`, dan `handlandmark-lite`.
- **Kata tubuh tidak menunjuk:** pastikan bagian yang dipilih terlihat jelas. Untuk tangan dekatkan telapak, untuk lutut/mata kaki mundur sampai seluruh kaki masuk bingkai. Kamera atau perangkat lambat bisa membuat penanda tidak muncul setiap saat.
- **Login berhasil tetapi pengajar ditolak:** cocokkan email Auth dengan `INSTRUCTOR_EMAIL`, pastikan email dikonfirmasi, lalu redeploy sesudah perubahan variabel.
- **Function tidak tersedia saat `npm run dev`:** Vite hanya melayani frontend; gunakan Vercel seperti pada langkah deployment.
- **Hasil selalu tidak dikenal:** daftarkan tiga sampel baru dalam cahaya terang; gunakan satu wajah di kamera dan uji slider dengan orang yang berbeda. Angka ambang awal adalah pilihan demo, bukan jaminan akurasi.
- **Error SQL/pgvector:** gunakan proyek Supabase baru, jalankan 01 → 02 → 03, lalu salin pesan error yang tepat sebelum meneruskan.

## Privasi dan batasan

Sampel disimpan sebagai embedding 1024 angka, **bukan foto/video**. Embedding tetap dapat digunakan untuk membedakan orang dan harus diperlakukan sebagai data biometrik. Hanya peserta yang menyetujui boleh didaftarkan. Pengajar bisa menghapus profil dan riwayat; penghapusan profil sekaligus menghapus sampel dan riwayat terkait. Jangan memakai hasil ini untuk presensi, penilaian otomatis, atau keputusan administratif. Kamera biasa dan gerakan kepala tidak menjamin seseorang tidak menggunakan foto.
