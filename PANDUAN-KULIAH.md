# Panduan demo di kelas

## Hasil belajar

Mahasiswa dapat menjelaskan lima hal: (1) kamera memperoleh video, (2) model pose, tangan, dan wajah menandai bagian tubuh untuk kosakata Arab, (3) model wajah membuat embedding berupa angka, (4) Supabase menyimpan dan mencari data, (5) kosakata yang tidak terlacak tetap bisa dipelajari tanpa label palsu. Setelah membuka satu URL, mahasiswa dapat belajar kosakata tanpa akun dan pengajar dapat mendemonstrasikan riwayat wajah di database.

## Persiapan dosen (sebelum mahasiswa masuk)

1. Pastikan tiga query SQL, Vercel, email pengajar, dan model kamera telah diuji di ponsel yang akan dipakai. Periksa penanda untuk wajah, telapak tangan, dan lutut secara terpisah.
2. Pilih 2–4 sukarelawan dewasa yang memahami tujuan demo dan setuju. Siapkan kondisi terang. Orang lain dapat menjadi contoh "tidak dikenal" tanpa disimpan.
3. Gunakan **satu perangkat yang dioperasikan pengajar** untuk pendaftaran agar kunci dan akun tidak dibagikan. Siapkan layar kedua dengan Supabase Table Editor pada `face_profiles` dan `face_events`.
4. Ingatkan kelas bahwa skor kemiripan adalah hasil model, bukan bukti identitas; wajah kembar, foto, kondisi cahaya, dan perangkat bisa memengaruhi hasil.

## Pertemuan 1 — Kamera, kosakata dan AR

- Tunjukkan tombol kamera dan izin akses di browser.
- Buka **Kosakata Tubuh**; tunjukkan kata dari tiga kelompok: kepala/wajah, tubuh/tangan, kaki.
- Tampilkan wajah, tangan dan lutut secara bergantian. Pilih satu kata tiap kali agar label AR mudah dibaca.
- Bandingkan penanda yang langsung dideteksi (lutut) dengan perkiraan dari titik pose (dada); bahas mengapa rambut/gigi/telapak kaki hanya berupa kosakata.
- Jelaskan `getUserMedia`, model wajah, MoveNet, model tangan, koordinat titik, dan Canvas.
- Coba kondisi saat bagian tubuh di luar kamera dan dua wajah untuk menunjukkan batas sistem.

## Pertemuan 2 — Pendaftaran dan database

- Buka tab **Daftarkan Wajah**; sebutkan persetujuan sebelum menyimpan.
- Ambil tiga sampel berbeda dan tunjukkan nama peserta di Supabase Table Editor.
- Jelaskan perbedaan `face_profiles`, `face_samples`, dan `face_events`; sambungkan ke konsep relasi dan foreign key.
- Minta mahasiswa memprediksi hasil kamera untuk orang yang baru dan yang sudah terdaftar.

## Pertemuan 3 — Pengenalan dan pengujian

- Tunjukkan proses pencarian kandidat terdekat dan slider kemiripan.
- Uji orang terdaftar, orang lain yang belum didaftar, dan penerangan berbeda.
- Perlihatkan riwayat; ubah ambang dan diskusikan salah cocok serta tidak cocok.
- Hapus profil atas permintaan sukarelawan dan amati efeknya pada tabel sampel/riwayat.

## Tugas mahasiswa

Modifikasi satu bagian berikut: tambahkan kata Arab baru ke `src/vocabulary.ts`, jelaskan mengapa gigi tidak diberi marker otomatis, jelaskan mengapa gambar wajah tidak perlu disimpan, buat visualisasi jumlah pencocokan per kelas, atau uji beberapa tingkat cahaya. Penilaian menekankan pemahaman alur dan keterbatasan model, bukan memaksimalkan pengumpulan data wajah.
