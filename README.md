# SIMONDA Rote Ndao

Sistem monitoring inovasi daerah Kabupaten Rote Ndao. Dipakai sepanjang tahun untuk
mengumpulkan inovasi dan mencicil bukti dukungnya, supaya saat window pelaporan
Innovative Government Award (IGA) dibuka, datanya tinggal disalin.

Django 5 + Django Ninja di belakang, React di depan.

---

## Alur kerja

    Operator OPD                  Verifikator (Bappelitbangda)
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

**Minimal 5 dari 6 urusan wajib pelayanan dasar.** Kurang dari itu, Skor Jumlah
Inovasi jadi nol — hilang sampai 76 poin atau 30,4% dari skor maksimum. Beranda
menampilkan urusan mana yang masih kosong.

**Pembagi MAX(12, n).** Melaporkan kurang dari 12 inovasi tetap dibagi 12, jadi
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
python manage.py seed_simonda --tahun 2026    # catat kata sandi yang dicetak
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
atas. Gaya ditulis tangan di `src/gaya.css` memakai variabel CSS, dan tidak ada
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
python uji_alur.py        # 39 pemeriksaan alur kerja
python uji_kontrak.py     # 41 pemeriksaan kontrak API terhadap antarmuka
```

`uji_skor.py` membuktikan ulang angka resmi pedoman dari bobot yang dimasukkan.
`uji_alur.py` menguji isolasi antar OPD, penguncian saat menunggu verifikasi,
pemeriksaan kelayakan, aturan 5 dari 6 urusan, pembagi MAX(12, n), selisih klaim
versus terverifikasi, dan ekspor CSV.
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

---

## Membuat akun OPD

Lewat `/admin/` → Users → Add. Isi peran dan OPD:

| Peran | Bisa apa |
|---|---|
| Operator OPD | Hanya inovasi OPD-nya sendiri. Tidak bisa memverifikasi. |
| Verifikator | Melihat semua OPD, memverifikasi, mengekspor. |
| Administrator | Semua di atas, plus Django admin. |

Satu operator per OPD sudah cukup untuk awal. Tambah bila perlu.

---

## Sebelum dipakai sungguhan

**Katalog indikator** diambil dari Lampiran II Surat Kepala BSKDN Nomor
400.10.11/1887/BSKDN tanggal 29 April 2026, tersimpan di `inovasi/iga.py`.
`uji_skor.py` memverifikasinya terhadap angka yang disebut pedoman sendiri
(63 / 111 / 76 / 250 dan proporsi 25,20% / 44,40% / 30,40%). Jalankan uji itu
setiap kali katalog disunting.

Untuk tahun berikutnya, ubah `PEMBAGI_MINIMAL` dan `MIN_URUSAN_YANDAS` di
`iga.py` sesuai tabel prognosis: pembagi 14 pada 2027, 16 pada 2028, 18 pada
2029; urusan yandas naik jadi 6 mulai 2027.

**Cocokkan daftar OPD** dengan SOTK Rote Ndao yang berlaku. Daftar di
`seed_simonda.py` masih perkiraan.

**Ganti SECRET_KEY** dan kata sandi administrator hasil seed.

---

## Menaikkan ke produksi

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
