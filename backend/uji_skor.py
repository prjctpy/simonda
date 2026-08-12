"""Menguji katalog indikator dan mesin skor terhadap angka yang disebut
sendiri oleh Pedoman Umum IGA 2026. Jalankan tanpa Django:

    python uji_skor.py
"""
from decimal import Decimal

from inovasi import iga

lolos = gagal = 0


def cek(nama, syarat, tambahan=""):
    global lolos, gagal
    if syarat:
        lolos += 1
        print(f"  OK   {nama}")
    else:
        gagal += 1
        print(f"  GAGAL {nama} {tambahan}")


print("\n== Struktur katalog ==")
nomor_spd = sorted({b[0] for b in iga.SPD})
cek("15 indikator SPD", len(nomor_spd) == 15, nomor_spd)
cek("20 baris skor SPD", len(iga.SPD) == 20, len(iga.SPD))
cek("20 indikator SID", len(iga.SID) == 20, len(iga.SID))
cek("SID bernomor 16 s.d. 35", [b[0] for b in iga.SID] == list(range(16, 36)))
cek("3 variabel SPD", len({b[2] for b in iga.SPD}) == 3, {b[2] for b in iga.SPD})
cek("5 variabel SID", len({b[2] for b in iga.SID}) == 5, {b[2] for b in iga.SID})
cek("setiap baris punya 3 parameter", all(len(b[6]) == 3 for b in iga.SPD + iga.SID))

print("\n== Skor maksimum (angka resmi pedoman) ==")
maks_spd = sum(iga.skor_baris(b[4], 3) for b in iga.SPD)
maks_sid = sum(iga.skor_baris(b[4], 3) for b in iga.SID)
cek("SPD maksimum 63", maks_spd == iga.MAKS_SPD, maks_spd)
cek("SID indikator maksimum 111", maks_sid == iga.MAKS_SID_INDIKATOR, maks_sid)
cek("Jumlah Inovasi maksimum 76",
    iga.skor_jumlah_inovasi(200, 6) == iga.MAKS_JUMLAH_INOVASI,
    iga.skor_jumlah_inovasi(200, 6))
cek("Total maksimum 250", maks_spd + maks_sid + iga.MAKS_JUMLAH_INOVASI == iga.MAKS_TOTAL)

print("\n== Proporsi aspek ==")
p_spd = maks_spd / iga.MAKS_TOTAL * 100
p_sid_ind = maks_sid / iga.MAKS_TOTAL * 100
p_jml = iga.MAKS_JUMLAH_INOVASI / iga.MAKS_TOTAL * 100
cek("SPD 25,20%", round(p_spd, 2) == Decimal("25.20"), p_spd)
cek("indikator SID 44,40%", round(p_sid_ind, 2) == Decimal("44.40"), p_sid_ind)
cek("Jumlah Inovasi 30,40%", round(p_jml, 2) == Decimal("30.40"), p_jml)

print("\n== Indikator wajib (mandatori) ==")
wajib_spd = [f"{b[0]}{b[1]}" for b in iga.SPD if b[5]]
wajib_sid = [b[3] for b in iga.SID if b[5]]
cek("10 indikator SPD wajib", len({f.rstrip('ab') for f in wajib_spd}) == 10,
    sorted({f.rstrip('ab') for f in wajib_spd}))
cek("5 indikator SID wajib", len(wajib_sid) == 5, wajib_sid)
cek("Regulasi, SDM, Kecepatan, Kemanfaatan, Video",
    set(wajib_sid) == {"Regulasi Inovasi Daerah",
                       "Ketersediaan dan peran SDM terhadap inovasi daerah",
                       "Kecepatan penciptaan inovasi", "Kemanfaatan inovasi",
                       "Video inovasi daerah"})

print("\n== Nilai sempurna ==")
sempurna = iga.hitung_indeks(maks_spd, [maks_sid] * 200, 6)
cek("indeks 100,00", sempurna["indeks"] == Decimal("100.00"), sempurna["indeks"])
cek("kategori Sangat Inovatif", sempurna["kategori"] == "Sangat Inovatif")

print("\n== Aturan 5 dari 6 urusan wajib pelayanan dasar ==")
cukup = iga.hitung_indeks(40, [70] * 20, 5)
kurang = iga.hitung_indeks(40, [70] * 20, 4)
cek("5 urusan: skor jumlah inovasi terhitung", cukup["skor_jumlah_inovasi"] > 0)
cek("4 urusan: skor jumlah inovasi nol", kurang["skor_jumlah_inovasi"] == 0)
selisih = cukup["indeks"] - kurang["indeks"]
cek("kehilangan lebih dari 3 poin indeks", selisih > 3, f"selisih {selisih}")
print(f"       20 inovasi, 4 urusan yandas: {kurang['indeks']} ({kurang['kategori']})")
print(f"       20 inovasi, 5 urusan yandas: {cukup['indeks']} ({cukup['kategori']})")

print("\n== Pembagi MAX(12, n) ==")
lapan = iga.hitung_indeks(40, [80] * 8, 5)
dua_belas = iga.hitung_indeks(40, [80] * 12, 5)
cek("8 inovasi tetap dibagi 12", lapan["pembagi"] == 12, lapan["pembagi"])
cek("15 inovasi dibagi 15", iga.hitung_indeks(40, [80] * 15, 5)["pembagi"] == 15)
cek("4 kursi kosong terdeteksi", lapan["kursi_kosong"] == 4, lapan["kursi_kosong"])
cek("12 inovasi lebih tinggi dari 8", dua_belas["indeks"] > lapan["indeks"])
print(f"       8 inovasi bermutu 80: {lapan['indeks']}")
print(f"      12 inovasi bermutu 80: {dua_belas['indeks']}")

print("\n== Nilai tambah satu inovasi ==")
naik_ke_9 = iga.potensi_tambahan(40, [80] * 8, 5, 80)
naik_ke_21 = iga.potensi_tambahan(40, [80] * 20, 5, 80)
cek("menambah inovasi ke-9 menaikkan indeks", naik_ke_9 > 0, naik_ke_9)
cek("tambahan di bawah 12 lebih besar dampaknya", naik_ke_9 > naik_ke_21,
    f"{naik_ke_9} vs {naik_ke_21}")
print(f"       inovasi ke-9  : +{naik_ke_9} poin indeks")
print(f"       inovasi ke-21 : +{naik_ke_21} poin indeks")

print("\n== Ambang kategori ==")
cek("65,01 Sangat Inovatif", iga.kategori("65.01") == "Sangat Inovatif")
cek("65,00 Inovatif", iga.kategori("65.00") == "Inovatif")
cek("40,00 Kurang Inovatif", iga.kategori("40.00") == "Kurang Inovatif")
cek("0 Tidak Dapat Dinilai", iga.kategori("0") == "Tidak Dapat Dinilai")

print(f"\n{'=' * 46}\n  {lolos} lolos, {gagal} gagal\n{'=' * 46}\n")
raise SystemExit(1 if gagal else 0)
