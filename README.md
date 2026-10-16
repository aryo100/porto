# Porto

Portfolio publik membaca konten dari `porto-service` melalui endpoint `GET /api/v1/content/{home,projects,experience,blog,site}`. Detail artikel memakai `GET /api/v1/blog-posts/slug/{slug}`. Profil, tampilan situs, dan metadata memakai `GET /api/v1/settings`. Gambar upload dilayani oleh `porto-service`. Tombol Download CV di halaman utama mengambil PDF dari `GET /api/v1/settings/cv` setelah CV diunggah dan disimpan melalui Portfolio CMS → Settings → Profile.

Jalankan `porto-service` dan atur `NEXT_PUBLIC_API_BASE_URL` di `.env.local` (contoh: `http://127.0.0.1:3100/api/v1`), lalu jalankan `npm run dev`. Tanpa konfigurasi, alamat lokal tersebut dipakai sebagai default. Jika service belum tersedia, situs menampilkan status gagal memuat konten.
