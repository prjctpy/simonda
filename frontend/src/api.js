/**
 * Klien API SIMONDA.
 *
 * Token disimpan di sessionStorage agar hilang saat tab ditutup — komputer
 * kantor sering dipakai bergantian. Ganti ke localStorage hanya bila
 * perangkatnya dipastikan milik satu orang.
 */

const DASAR = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
const KUNCI = 'simonda.token';

export class GalatAPI extends Error {
  constructor(pesan, status) {
    super(pesan);
    this.status = status;
  }
}

const token = {
  ambil: () => sessionStorage.getItem(KUNCI),
  simpan: (t) => sessionStorage.setItem(KUNCI, t),
  hapus: () => sessionStorage.removeItem(KUNCI),
};

async function minta(jalur, { metode = 'GET', tubuh, berkas, params } = {}) {
  const url = new URL(DASAR + jalur);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }

  const kepala = {};
  const t = token.ambil();
  if (t) kepala.Authorization = `Bearer ${t}`;

  let isi;
  if (berkas) {
    isi = new FormData();
    isi.append('berkas', berkas);
  } else if (tubuh !== undefined) {
    kepala['Content-Type'] = 'application/json';
    isi = JSON.stringify(tubuh);
  }

  let resp;
  try {
    resp = await fetch(url, { method: metode, headers: kepala, body: isi });
  } catch {
    throw new GalatAPI('Server tidak dapat dihubungi. Periksa koneksi jaringan kantor.', 0);
  }

  if (resp.status === 401) {
    token.hapus();
    window.dispatchEvent(new Event('simonda:keluar'));
    throw new GalatAPI('Sesi berakhir. Masuk kembali untuk melanjutkan.', 401);
  }
  if (resp.status === 204) return null;

  const tipe = resp.headers.get('content-type') || '';
  if (tipe.includes('text/csv')) return resp.blob();

  const data = tipe.includes('json') ? await resp.json() : null;
  if (!resp.ok) {
    throw new GalatAPI(data?.detail || data?.pesan || `Permintaan gagal (${resp.status}).`, resp.status);
  }
  return data;
}

export const api = {
  // sesi
  masuk: async (username, password) => {
    const r = await minta('/auth/masuk', { metode: 'POST', tubuh: { username, password } });
    token.simpan(r.akses);
    return r;
  },
  keluar: () => token.hapus(),
  adaSesi: () => !!token.ambil(),
  saya: () => minta('/auth/saya'),

  // referensi
  opd: () => minta('/opd'),
  periode: () => minta('/periode'),
  indikator: (periode_id) => minta('/indikator', { params: { periode_id } }),

  // inovasi
  daftarInovasi: (filter = {}) => minta('/inovasi', { params: filter }),
  ambilInovasi: (id) => minta(`/inovasi/${id}`),
  buatInovasi: (data) => minta('/inovasi', { metode: 'POST', tubuh: data }),
  ubahInovasi: (id, data) => minta(`/inovasi/${id}`, { metode: 'PUT', tubuh: data }),
  hapusInovasi: (id) => minta(`/inovasi/${id}`, { metode: 'DELETE' }),
  ajukan: (id) => minta(`/inovasi/${id}/ajukan`, { metode: 'POST' }),
  verifikasiInovasi: (id, keputusan, catatan = '') =>
    minta(`/inovasi/${id}/verifikasi`, { metode: 'POST', tubuh: { keputusan, catatan } }),

  // nilai indikator SID
  ubahNilai: (inovasiId, indikatorId, data) =>
    minta(`/inovasi/${inovasiId}/nilai/${indikatorId}`, { metode: 'PUT', tubuh: data }),
  unggahBerkas: (inovasiId, indikatorId, berkas) =>
    minta(`/inovasi/${inovasiId}/nilai/${indikatorId}/berkas`, { metode: 'POST', berkas }),
  verifikasiNilai: (inovasiId, indikatorId, keputusan, catatan = '') =>
    minta(`/inovasi/${inovasiId}/nilai/${indikatorId}/verifikasi`, {
      metode: 'POST', tubuh: { keputusan, catatan },
    }),

  // indikator SPD tingkat daerah
  spd: () => minta('/spd'),
  ubahSPD: (indikatorId, data) => minta(`/spd/${indikatorId}`, { metode: 'PUT', tubuh: data }),

  // statistik
  ringkasan: () => minta('/statistik/ringkasan'),
  rekapOPD: () => minta('/statistik/opd'),

  unduhCSV: async (periode_id) => {
    const blob = await minta('/ekspor/iga', { params: { periode_id } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inovasi-rote-ndao.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

/* Label bahasa Indonesia untuk kode yang dipakai backend. */
export const LABEL = {
  status: {
    draft: 'Draft', diajukan: 'Menunggu verifikasi',
    revisi: 'Perlu revisi', terverifikasi: 'Terverifikasi',
  },
  tahapan: { inisiatif: 'Inisiatif', uji_coba: 'Uji Coba', penerapan: 'Penerapan' },
  jenis: { digital: 'Digital', non_digital: 'Non-Digital' },
  bentuk: {
    tata_kelola: 'Tata Kelola Pemerintahan Daerah',
    pelayanan_publik: 'Pelayanan Publik',
    lainnya: 'Inovasi Daerah Lainnya',
  },
  inisiator: {
    kepala_daerah: 'Kepala Daerah', dprd: 'Anggota DPRD', asn: 'ASN',
    perangkat_daerah: 'Perangkat Daerah', masyarakat: 'Masyarakat',
  },
  klasifikasi: {
    perangkat_daerah: 'Inovasi Perangkat Daerah',
    desa: 'Inovasi Desa', masyarakat: 'Inovasi Masyarakat',
  },
  pkpn: {
    pangan: 'Kedaulatan Pangan', energi: 'Kemandirian Energi dan Air',
    pendidikan: 'Pendidikan', kesehatan: 'Kesehatan',
    hilirisasi: 'Hilirisasi dan Industrialisasi',
    infrastruktur: 'Infrastruktur Perumahan dan Ketahanan Bencana',
    desa: 'Ekonomi Kerakyatan dan Desa', kemiskinan: 'Penurunan Kemiskinan',
    non_pkpn: 'Non PKPN',
  },
  verifikasi: { menunggu: 'Menunggu', diterima: 'Diterima', ditolak: 'Ditolak' },
};

/* Konstanta penilaian, harus sama dengan inovasi/iga.py di backend. */
export const IGA = {
  MAKS_TOTAL: 250,
  MAKS_SPD: 63,
  MAKS_SID: 111,
  MAKS_JUMLAH: 76,
  BOBOT_JUMLAH: 0.38,
  AMBANG: [
    { nilai: 40.01, nama: 'Inovatif' },
    { nilai: 65.01, nama: 'Sangat Inovatif' },
  ],
};

export const URUSAN = [
  'Pendidikan', 'Kesehatan', 'Pekerjaan Umum dan Penataan Ruang',
  'Perumahan Rakyat dan Kawasan Permukiman',
  'Ketenteraman, Ketertiban Umum, dan Perlindungan Masyarakat', 'Sosial',
  'Tenaga Kerja', 'Pemberdayaan Perempuan dan Perlindungan Anak', 'Pangan',
  'Pertanahan', 'Lingkungan Hidup', 'Administrasi Kependudukan dan Pencatatan Sipil',
  'Pemberdayaan Masyarakat dan Desa', 'Pengendalian Penduduk dan Keluarga Berencana',
  'Perhubungan', 'Komunikasi dan Informatika', 'Koperasi, Usaha Kecil, dan Menengah',
  'Penanaman Modal', 'Kepemudaan dan Olahraga', 'Statistik', 'Persandian',
  'Kebudayaan', 'Perpustakaan', 'Kearsipan', 'Kelautan dan Perikanan',
  'Pariwisata', 'Pertanian', 'Kehutanan', 'Energi dan Sumber Daya Mineral',
  'Perdagangan', 'Perindustrian', 'Transmigrasi',
  'Perencanaan', 'Keuangan', 'Kepegawaian', 'Pendidikan dan Pelatihan',
  'Penelitian dan Pengembangan',
];
