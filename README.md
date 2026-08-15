# SIMONDA Rote Ndao

Sistem Monitoring Inovasi Daerah Kabupaten Rote Ndao. Dipakai sepanjang tahun untuk
mengumpulkan inovasi dan mencicil bukti dukungnya, supaya saat window pelaporan
Innovative Government Award (IGA) dibuka, datanya tinggal disalin.

Django 5 + Django Ninja di belakang, React di depan.

---

## Alur kerja

    Operator OPD                  Verifikator (Bapperida)
    ────────────                  ────────────────────────────
    buat inovasi (draft)
    isi bukti 21 indikator
    ajukan  ───────────────────▶  baca, periksa berkas
                                  ├─ kembalikan + catatan ─▶ status "revisi"
                                  └─ terima ──────────────▶ status "terverifikasi"
                                  verifikasi bukti per indikator
                                  ekspor CSV saat window IGA buka

Sistem menghitung **proyeksi Indeks Inovasi Daerah** memakai rumus asli Lampiran I
butir XI.B, dan menampilkannya dalam dua versi:

- **Klaim** — memakai parameter yang dipilih OPD sendiri.
- **Terverifikasi** — hanya nilai yang sudah dibenarkan verifikator, dan hanya
  inovasi yang lolos syarat kelayakan.

Angka kedua yang dibawa ke rapat. Selisihnya menunjukkan OPD mana yang melaporkan
lebih baik daripada kenyataannya.

Struktur penilaian mengikuti Lampiran II:

| Aspek | Isi | Skor maks | Porsi |
|---|---|---|---|
| SPD | 15 indikator daerah, 20 baris skor | 63 | 25,20% |
| SID | 20 indikator per inovasi | 111 | 44,40% |
| Jumlah Inovasi | dihitung otomatis | 76 | 30,40% |
| **Total** | | **250** | **100%** |

Tiap indikator punya tiga parameter. Skor satu baris = bobot x parameter terpilih.

## Tiga aturan yang menentukan skor

**Seluruh 6 urusan wajib pelayanan dasar harus terpenuhi.** Kurang satu saja,
Skor Jumlah Inovasi jadi nol — hilang sampai 76 poin atau 30,4% dari skor
maksimum. Beranda menampilkan urusan mana yang masih kosong.

**Pembagi MAX(14, n).** Melaporkan kurang dari 14 inovasi tetap dibagi 14, jadi
rata-rata kematangan ikut turun. Sistem menampilkan berapa "kursi kosong" tersisa.

**Syarat umur inovasi.** Penerapan harus antara 1 Januari 2024 dan 31 Desember
2025, atau ada pengembangan dalam rentang itu. Rancang bangun minimal 300 kata.
Inovasi yang gagal syarat ini ditandai dan tidak ikut diekspor.

Setiap kali OPD mengubah bukti, status verifikasinya otomatis kembali ke
"menunggu". Bukti lama tidak bisa diam-diam diganti setelah disetujui.

---

## Memasang

### Backend

Basis data memakai PostgreSQL, termasuk untuk pengembangan lokal (bukan cuma
produksi). Siapkan peran dan basis datanya sekali saja:

```bash
sudo -u postgres psql -c "CREATE ROLE simonda WITH LOGIN PASSWORD 'ganti-ini';"
sudo -u postgres psql -c "CREATE DATABASE simonda WITH OWNER simonda ENCODING 'UTF8';"
```

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cat > .env <<'EOF'
DEBUG=1
SECRET_KEY=ganti-dengan-hasil-perintah-di-bawah
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ORIGINS=http://localhost:5173
DB_NAME=simonda
DB_USER=simonda
DB_PASSWORD=ganti-ini
DB_HOST=localhost
DB_PORT=5432
EOF

python -c "import secrets; print(secrets.token_urlsafe(50))"   # isi SECRET_KEY

python manage.py migrate
python manage.py seed_simonda --tahun 2027    # catat kata sandi yang dicetak
python manage.py runserver
```

Kosongkan blok `DB_*` di `.env` untuk memakai SQLite berkas lokal alih-alih
Postgres — cukup untuk uji coba cepat, tapi jangan dipakai untuk data yang
sungguhan dipakai (lihat catatan di `simonda/settings.py`).

Dokumentasi API otomatis tersedia di `http://localhost:8000/api/docs`.
Django admin di `/admin/` untuk membuat akun operator tiap OPD.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # sesuaikan VITE_API_URL bila perlu
npm run dev                    # http://localhost:5173
```

React 18 dan Vite 7, tanpa pustaka UI atau router tambahan. Butuh Node 20.19 ke
atas. Gaya ditulis tangan di `src/index.css` memakai variabel CSS, dan tidak ada
font web supaya tetap terbaca saat jaringan kantor putus.

Bila npm menahan skrip `postinstall` milik esbuild dengan peringatan
`allow-scripts`, biarkan saja. Skrip itu hanya optimasi; binernya sudah datang
lewat paket `@esbuild/*` sesuai platform, dan `npm run dev` maupun
`npm run build` tetap berjalan normal. Membiarkannya tertahan justru pilihan
yang lebih aman.

Untuk produksi, `npm run build` menghasilkan `dist/` yang bisa disajikan Nginx
sebagai berkas statis di depan Gunicorn.

### Uji

```bash
cd backend
export ALLOWED_HOSTS=localhost,127.0.0.1,testserver
python uji_skor.py        # 32 pemeriksaan katalog dan rumus
python uji_alur.py        # 51 pemeriksaan alur kerja
python uji_kontrak.py     # 40 pemeriksaan kontrak API terhadap antarmuka
```

`uji_skor.py` membuktikan ulang angka resmi pedoman dari bobot yang dimasukkan.
`uji_alur.py` menguji isolasi antar OPD, penguncian saat menunggu verifikasi,
pemeriksaan kelayakan, aturan 6 dari 6 urusan, pembagi MAX(14, n), selisih klaim
versus terverifikasi, ekspor CSV, dan alur Kelola Akun OPD (verifikator membuat,
menonaktifkan/mengaktifkan, dan mereset sandi akun operator).
`uji_kontrak.py` memastikan setiap kolom yang dibaca berkas `.jsx` benar-benar
ada di respons API — inilah yang biasanya jebol saat backend diubah tetapi
frontend belum menyusul.

Jalankan ketiganya dengan basis data segar; `uji_alur.py` dan `uji_kontrak.py`
menghapus seluruh inovasi saat mulai.

## Peta antarmuka

| Halaman | Siapa | Isi |
|---|---|---|
| Beranda | semua | Proyeksi indeks, batang komposisi 250 poin, dua aturan penentu |
| Daftar inovasi | semua | Operator hanya melihat OPD sendiri |
| Antrean verifikasi | verifikator | Inovasi berstatus menunggu, dengan lencana jumlah |
| Indikator daerah | verifikator | 20 baris SPD, dikelompokkan per variabel |
| Rekap OPD | verifikator | Rata skor per OPD dan daftar yang belum melapor |
| Kelola Akun | verifikator | Buat, nonaktifkan/aktifkan, dan reset sandi akun operator OPD |

---

## Membuat akun OPD

`seed_simonda` sudah langsung membuat satu akun operator per OPD (username =
kode OPD huruf kecil, sandi awal `admin123` untuk semua — **wajib diganti**
sebelum dipakai sungguhan).

Akun operator baru berikutnya dibuat verifikator sendiri dari dalam SIMONDA,
lewat menu **Kelola Akun** (bisa buat, lihat daftar, nonaktifkan/aktifkan, dan
reset sandi — tanpa perlu Django Admin). Akun `verifikator`/`admin` baru tetap
lewat `/admin/` → Users → Add, karena itu batas kepercayaan yang lebih tinggi
dan bukan tugas rutin.

| Peran | Bisa apa |
|---|---|
| Operator OPD | Hanya inovasi OPD-nya sendiri. Tidak bisa memverifikasi. |
| Verifikator | Melihat semua OPD, memverifikasi, mengekspor, kelola akun operator. |
| Administrator | Semua di atas, plus Django admin. |

---

## Sebelum dipakai sungguhan

**Katalog indikator** diambil dari Lampiran II Surat Kepala BSKDN Nomor
400.10.11/1887/BSKDN tanggal 29 April 2026, tersimpan di `inovasi/iga.py`.
`uji_skor.py` memverifikasinya terhadap angka yang disebut pedoman sendiri
(63 / 111 / 76 / 250 dan proporsi 25,20% / 44,40% / 30,40%). Jalankan uji itu
setiap kali katalog disunting.

Sistem ini sudah dikonfigurasi untuk tahun 2027 (`PEMBAGI_MINIMAL=14`,
`MIN_URUSAN_YANDAS=6` — seluruh 6 urusan yandas wajib terpenuhi, tidak ada
slack). Untuk tahun berikutnya, ubah dua konstanta itu di `iga.py` sesuai tabel
prognosis: pembagi 16 pada 2028, 18 pada 2029.

**Daftar OPD** di `seed_simonda.py` sudah memuat 45 perangkat daerah Rote Ndao.
Cek ulang terhadap Perda SOTK yang berlaku bila ada pemekaran/penggabungan OPD
setelahnya.

**Ganti SECRET_KEY** dan kata sandi administrator hasil seed.

---

## Menaikkan ke produksi (VPS / server sendiri)

```bash
DEBUG=0
SECRET_KEY=<acak, 50 karakter>
ALLOWED_HOSTS=inovasi.rotendaokab.go.id
CSRF_ORIGINS=https://inovasi.rotendaokab.go.id
CORS_ORIGINS=https://inovasi.rotendaokab.go.id
DB_NAME=simonda
DB_USER=simonda
DB_PASSWORD=<acak>
DB_HOST=localhost
```

```bash
python manage.py collectstatic --noinput
gunicorn simonda.wsgi:application --bind 127.0.0.1:8000 --workers 3
```

Taruh Nginx di depan sebagai reverse proxy dengan sertifikat HTTPS. Saat `DEBUG=0`,
HSTS, cookie aman, dan pengalihan SSL menyala sendiri.

Berkas bukti dukung disimpan di `backend/media/`. Folder ini **tidak** ikut dalam
`collectstatic` dan wajib masuk jadwal backup — isinya SK, laporan, dan foto
kegiatan yang tidak ada salinannya di tempat lain. Backup basis data saja tidak cukup.

Simpan juga `LogAktivitas` (jejak audit) minimal satu siklus penilaian penuh.

---

## Deploy gratis (Render + Neon + R2 + Cloudflare Pages)

Susunan tanpa server sendiri, semua di tier gratis:

| Bagian | Layanan | Peran |
|---|---|---|
| Backend | [Render](https://render.com) | Web service Python, jalankan `render.yaml` |
| Basis data | [Neon](https://neon.tech) | PostgreSQL terkelola |
| Berkas bukti dukung | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | Pengganti `backend/media/`, wajib (lihat catatan di bawah) |
| Frontend | [Cloudflare Pages](https://pages.cloudflare.com) | Hosting statis hasil `npm run build` |

Kenapa berkas **wajib** pindah ke R2, bukan sekadar pilihan: disk Render tier
gratis bersifat sementara — berkas yang diunggah ke `backend/media/` hilang
tiap kali servis redeploy atau bangun ulang. Dan karena frontend (Cloudflare
Pages) dan backend (Render) jadi dua domain berbeda, tautan berkas juga harus
berupa URL utuh (R2 memberi ini otomatis), bukan path relatif seperti saat
frontend-backend satu server.

### Urutan setup

**1. Neon** — buat project, salin connection string-nya (`postgresql://...`).
Simpan dulu, dipakai di langkah 3.

**2. Cloudflare R2** — buat bucket, buat R2 API token (catat *Access Key ID*
dan *Secret Access Key*), catat *Account ID* kamu (untuk menyusun
`R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com`).

**3. Render** — hubungkan repo GitHub ini, lalu **New → Blueprint** dan pilih
`render.yaml` di root repo. Setelah Blueprint dibuat, isi env var yang di
`render.yaml` ditandai `sync: false` lewat dashboard (nilainya sengaja tidak
ada di file, supaya tidak ke-commit ke git):

```
SECRET_KEY       = (python -c "import secrets; print(secrets.token_urlsafe(50))")
ALLOWED_HOSTS    = simonda-api-xxxx.onrender.com   # domain yang Render kasih
DATABASE_URL     = (connection string dari langkah 1)
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL
                 = (dari langkah 2)
CORS_ORIGINS, CSRF_ORIGINS = (isi sementara dengan apa saja, diupdate di langkah 5)
```

Deploy, lalu catat URL servisnya.

**4. Cloudflare Pages** — hubungkan repo yang sama. Root directory `frontend`,
framework preset **Vite**, build command `npm run build`, output directory
`dist`. Isi environment variable `VITE_API_URL` = URL Render dari langkah 3
(Vite membakukan env var ini saat *build*, jadi harus diisi di sini, bukan
cuma di `.env` lokal). Deploy, catat domain Pages-nya.

**5. Kembali ke Render** — update `CORS_ORIGINS` dan `CSRF_ORIGINS` dengan
domain Cloudflare Pages dari langkah 4 (`https://simonda-xxxx.pages.dev`),
lalu redeploy servis.

**6. Isi data awal** — buka tab **Shell** di dashboard Render, jalankan:
```bash
python manage.py seed_simonda --tahun 2027
```
Ini mengisi 45 OPD, katalog indikator, dan akun administrator ke database
Neon yang masih kosong.

### Yang perlu diketahui soal tier gratis

Render free web service **tidur** setelah kurang lebih 15 menit tidak ada
trafik — permintaan pertama setelahnya bisa menunggu 30–60 detik sebelum
servis menyala lagi (*cold start*). Beri tahu verifikator/operator soal ini
supaya tidak mengira sistem rusak. Neon free tier juga auto-suspend saat idle,
tapi bangunnya jauh lebih cepat (biasanya di bawah 1 detik) dan sudah
ditangani lewat `conn_max_age=0` di `settings.py`.
