import secrets
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from inovasi import iga
from inovasi.models import OPD, Indikator, Periode, User

# Sesuaikan dengan SOTK Rote Ndao yang berlaku sebelum dipakai.
DAFTAR_OPD = [
    ("SETDA", "Sekretariat Daerah"),
    ("SETWAN", "Sekretariat DPRD"),
    ("BAPPERIDA", "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah"),
    ("BKAD", "Badan Keuangan dan Aset Daerah"),
    ("BKPSDM", "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia"),
    ("INSPEKTORAT", "Inspektorat Daerah"),
    ("DISDIKBUD", "Dinas Pendidikan dan Kebudayaan"),
    ("DINKES", "Dinas Kesehatan"),
    ("RSUD", "RSUD Ba'a"),
    ("DPUPR", "Dinas Pekerjaan Umum dan Penataan Ruang"),
    ("DPKP", "Dinas Perumahan dan Kawasan Permukiman"),
    ("DINSOS", "Dinas Sosial"),
    ("DUKCAPIL", "Dinas Kependudukan dan Pencatatan Sipil"),
    ("DISKOMINFO", "Dinas Komunikasi dan Informatika"),
    ("DPMD", "Dinas Pemberdayaan Masyarakat dan Desa"),
    ("DPMPTSP", "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu"),
    ("DISTAN", "Dinas Pertanian"),
    ("DKP", "Dinas Kelautan dan Perikanan"),
    ("DISPAR", "Dinas Pariwisata"),
    ("DISHUB", "Dinas Perhubungan"),
    ("DISPERINDAG", "Dinas Perindustrian dan Perdagangan"),
    ("DLH", "Dinas Lingkungan Hidup"),
    ("SATPOLPP", "Satuan Polisi Pamong Praja"),
    ("BPBD", "Badan Penanggulangan Bencana Daerah"),
]

class Command(BaseCommand):
    help = "Mengisi data awal: OPD, periode berjalan, indikator, dan akun administrator."

    def add_arguments(self, parser):
        parser.add_argument("--tahun", type=int, default=date.today().year)
        parser.add_argument("--admin", type=str, default="admin")

    @transaction.atomic
    def handle(self, *args, **opsi):
        tahun, nama_admin = opsi["tahun"], opsi["admin"]

        for kode, nama in DAFTAR_OPD:
            OPD.objects.get_or_create(kode=kode, defaults={"nama": nama, "singkatan": kode})
        self.stdout.write(self.style.SUCCESS(f"{len(DAFTAR_OPD)} OPD siap."))

        periode, baru = Periode.objects.get_or_create(tahun=tahun, defaults={"aktif": True})
        if not periode.aktif:
            periode.aktif = True
            periode.save()

        dibuat = 0
        for aspek, daftar in ((Indikator.SPD, iga.SPD), (Indikator.SID, iga.SID)):
            for nomor, sub, variabel, nama, bobot, wajib, params in daftar:
                Indikator.objects.update_or_create(
                    periode=periode, nomor=nomor, sub=sub,
                    defaults={"aspek": aspek, "variabel": variabel, "nama": nama,
                              "bobot": bobot, "wajib": wajib, "aktif": True,
                              "parameter_1": params[0], "parameter_2": params[1],
                              "parameter_3": params[2]},
                )
                dibuat += 1
        self.stdout.write(self.style.SUCCESS(
            f"Periode {tahun} aktif. {dibuat} baris indikator dimuat "
            f"({len(iga.SPD)} SPD + {len(iga.SID)} SID)."))

        if not User.objects.filter(username=nama_admin).exists():
            sandi = secrets.token_urlsafe(12)
            User.objects.create_superuser(
                username=nama_admin, password=sandi, peran=User.ADMIN, first_name="Administrator"
            )
            self.stdout.write(self.style.WARNING(
                f"\nAkun administrator dibuat.\n  Pengguna : {nama_admin}\n  Kata sandi: {sandi}\n"
                "Catat sekarang, lalu ganti setelah masuk pertama kali.\n"
            ))
        else:
            self.stdout.write("Akun administrator sudah ada, dilewati.")

        self.stdout.write(self.style.SUCCESS(
            "Selesai. Buat akun operator tiap OPD lewat /admin/ dan tetapkan peran 'Operator OPD'.\n"
            f"Ingat: laporkan minimal {periode.pembagi_minimal} inovasi dan minimal "
            f"{periode.min_urusan_yandas} dari 6 urusan wajib pelayanan dasar."
        ))
