from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from ninja import Schema


# ------------------------------- auth -------------------------------

class MasukIn(Schema):
    username: str
    password: str


class TokenOut(Schema):
    akses: str
    kedaluwarsa: datetime


class OPDRingkas(Schema):
    id: int
    kode: str
    nama: str


class ProfilOut(Schema):
    id: int
    username: str
    nama: str
    peran: str
    bisa_verifikasi: bool
    opd: Optional[OPDRingkas] = None


# ------------------------------ periode -----------------------------

class PeriodeOut(Schema):
    id: int
    tahun: int
    window_buka: Optional[date] = None
    window_tutup: Optional[date] = None
    aktif: bool


class IndikatorOut(Schema):
    id: int
    aspek: str
    kode: str
    nomor: int
    variabel: str
    nama: str
    bobot: Decimal
    wajib: bool
    parameter_1: str
    parameter_2: str
    parameter_3: str
    panduan: str = ""


# ------------------------------- bukti ------------------------------

class BuktiOut(Schema):
    indikator_id: int
    kode: str
    nomor: int
    variabel: str
    nama_indikator: str
    bobot: Decimal
    wajib: bool
    parameter_1: str
    parameter_2: str
    parameter_3: str
    pilihan: int
    basis_ukur: str = ""
    skor: Decimal
    skor_maks: Decimal
    catatan: str = ""
    tautan: str = ""
    berkas_url: Optional[str] = None
    verifikasi: str
    catatan_verifikator: str = ""
    diperbarui_pada: Optional[datetime] = None


class BuktiIn(Schema):
    pilihan: int
    basis_ukur: str = ""
    catatan: str = ""
    tautan: str = ""


class NilaiSPDIn(Schema):
    pilihan: int
    keterangan: str = ""
    tautan: str = ""


class NilaiSPDOut(Schema):
    indikator_id: int
    kode: str
    variabel: str
    nama: str
    bobot: Decimal
    wajib: bool
    parameter_1: str
    parameter_2: str
    parameter_3: str
    pilihan: int
    skor: Decimal
    skor_maks: Decimal
    keterangan: str = ""
    tautan: str = ""


class VerifikasiBuktiIn(Schema):
    keputusan: str          # diterima | ditolak | menunggu
    catatan: str = ""


# ------------------------------ inovasi -----------------------------

class InovasiIn(Schema):
    nama: str
    opd_id: Optional[int] = None      # diabaikan bila pengirim operator OPD
    tahapan: str = "inisiatif"
    inisiator: str = "perangkat_daerah"
    nama_inisiator: str = ""
    klasifikasi: str = "perangkat_daerah"
    jenis: str = "non_digital"
    bentuk: str = "pelayanan_publik"
    urusan: str = ""
    lintang: Optional[Decimal] = None
    bujur: Optional[Decimal] = None
    asta_cita: str = ""
    pkpn_klaster: str = ""
    pkpn_program: str = ""
    mulai_uji_coba: Optional[date] = None
    mulai_penerapan: Optional[date] = None
    pengembangan_terbaru: Optional[date] = None
    rancang_bangun: str = ""
    tujuan: str = ""
    manfaat: str = ""
    hasil: str = ""
    anggaran: Optional[Decimal] = None
    sumber_anggaran: str = ""
    pic_nama: str = ""
    pic_kontak: str = ""
    catatan_internal: str = ""


class InovasiRingkas(Schema):
    id: int
    nama: str
    opd: OPDRingkas
    tahapan: str
    jenis: str
    bentuk: str
    urusan: str
    status: str
    skor_klaim: Decimal
    skor_terverifikasi: Decimal
    persen_terverifikasi: int
    layak: bool
    diperbarui_pada: datetime


class InovasiDetail(InovasiRingkas):
    inisiator: str
    mulai_uji_coba: Optional[date] = None
    mulai_penerapan: Optional[date] = None
    rancang_bangun: str
    tujuan: str
    manfaat: str
    hasil: str
    anggaran: Optional[Decimal] = None
    sumber_anggaran: str
    pic_nama: str
    pic_kontak: str
    catatan_internal: str
    catatan_verifikasi: str
    diajukan_pada: Optional[datetime] = None
    diverifikasi_pada: Optional[datetime] = None
    nama_inisiator: str
    klasifikasi: str
    lintang: Optional[Decimal] = None
    bujur: Optional[Decimal] = None
    asta_cita: str
    pkpn_klaster: str
    pkpn_program: str
    pengembangan_terbaru: Optional[date] = None
    bisa_diubah: bool
    masalah_kelayakan: List[str]
    wajib_belum_terisi: List[str]
    bukti: List[BuktiOut]


class VerifikasiInovasiIn(Schema):
    keputusan: str          # terima | revisi
    catatan: str = ""


# ----------------------------- statistik ----------------------------

class HitunganOut(Schema):
    label: str
    jumlah: int


class ProyeksiOut(Schema):
    """Proyeksi Indeks Inovasi Daerah memakai rumus Lampiran I butir XI.B."""
    jumlah_inovasi: int
    pembagi: int
    kursi_kosong: int
    skor_spd: Decimal
    skor_spd_maks: Decimal
    rata_kematangan: Decimal
    skor_jumlah_inovasi: Decimal
    skor_sid: Decimal
    skor_total: Decimal
    indeks: Decimal
    kategori: str
    yandas_terpenuhi: int
    yandas_kurang: int
    yandas_terisi: List[str]
    yandas_kosong: List[str]


class RingkasanOut(Schema):
    tahun: int
    total_inovasi: int
    layak: int
    menunggu_verifikasi: int
    terverifikasi: int
    opd_terlibat: int
    opd_belum_lapor: int
    hari_menuju_tutup: Optional[int] = None
    proyeksi_klaim: ProyeksiOut
    proyeksi_terverifikasi: ProyeksiOut
    per_tahapan: List[HitunganOut]
    per_bentuk: List[HitunganOut]


class RekapOPDOut(Schema):
    opd: OPDRingkas
    jumlah: int
    terverifikasi: int
    layak: int
    rata_skor_klaim: Decimal
    rata_skor_terverifikasi: Decimal


class PesanOut(Schema):
    pesan: str
