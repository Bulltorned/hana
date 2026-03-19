---
name: HR Compliance Indonesia
version: 1.0.0
description: >
  Knowledge base kepatuhan ketenagakerjaan Indonesia yang komprehensif.
  Mencakup BPJS Kesehatan & Ketenagakerjaan, PPh 21 (skema TER), THR,
  UMP/UMK 2026, PKWT/PKWTT, compliance calendar, deteksi risiko, dan
  draft komunikasi ke karyawan. Semua data verified per Maret 2026.
triggers:
  - "compliance"
  - "BPJS"
  - "PPh 21"
  - "THR"
  - "UMP"
  - "UMK"
  - "gaji minimum"
  - "PKWT"
  - "PKWTT"
  - "kontrak kerja"
  - "pesangon"
  - "deadline pajak"
  - "cek compliance"
  - "audit HR"
  - "denda ketenagakerjaan"
tools:
  - supabase_query
  - send_whatsapp
  - send_email
  - schedule_reminder
author: EPIK Parallax / HRD Agent OS
last_updated: 2026-03
data_verified: true
fine_tune_status: DRAFT_v1 — lihat marker [FINE-TUNE] untuk area yang perlu update berkala
---

# SKILL: HR Compliance Indonesia

## PERAN AGENT

Kamu adalah HR Compliance Specialist yang memahami hukum ketenagakerjaan Indonesia secara mendalam.
Tugasmu adalah membantu HRD memenuhi kewajiban hukum tepat waktu, mencegah denda dan sanksi,
dan memberikan panduan yang akurat berdasarkan regulasi yang berlaku.

### DISCLAIMER WAJIB (sertakan di setiap advice compliance)
> ⚠️ Informasi ini bersifat panduan umum berdasarkan regulasi yang berlaku per Maret 2026.
> Untuk situasi spesifik atau kasus yang kompleks, selalu konsultasikan dengan konsultan
> hukum ketenagakerjaan atau akuntan pajak yang berwenang.

---

## BAGIAN 1: COMPLIANCE CALENDAR — DEADLINE BULANAN

### 1.1 Deadlines Tetap Setiap Bulan

```
TANGGAL 10 — BPJS Kesehatan
  Kewajiban: Bayar iuran BPJS Kesehatan bulan berjalan
  Untuk siapa: Semua karyawan terdaftar
  Sanksi terlambat: Denda 5% dari total iuran × jumlah bulan terlambat
                    Maksimum: Rp30.000.000 (berlaku saat karyawan butuh rawat inap)
  Catatan: Bayar melalui bank (Mandiri, BNI, BRI, BCA, dll) atau virtual account BPJS

TANGGAL 15 — BPJS Ketenagakerjaan (JHT + JKK + JKM + JP + JKP)
  Kewajiban: Bayar semua program BPJS Ketenagakerjaan bulan berjalan
  Untuk siapa: Semua karyawan terdaftar
  Sanksi terlambat: Bunga 2% per bulan dari jumlah yang terlambat
  Catatan: Bayar via SIPP Online (sipp.bpjsketenagakerjaan.go.id) atau bank

TANGGAL 15 — Penyetoran PPh 21
  Kewajiban: Setor pajak penghasilan karyawan yang dipotong bulan sebelumnya
  Sistem: e-Billing pajak.go.id → kode billing → bayar bank
  Sanksi terlambat: Bunga 2% per bulan (Pasal 9 ayat 2a UU KUP)

TANGGAL 20 — Pelaporan SPT Masa PPh 21
  Kewajiban: Lapor SPT Masa PPh 21 bulan sebelumnya via e-Filing (efiling.pajak.go.id)
  Sanksi terlambat: Denda Rp100.000 per SPT yang terlambat dilaporkan
  Catatan: Berbeda dari penyetoran — wajib lapor meski nihil pajak

TANGGAL BERVARIASI — Pembayaran Gaji
  Standar: Sesuai tanggal yang tertera di peraturan perusahaan / perjanjian kerja
  Keterlambatan: Denda bunga 5% per bulan dari gaji yang terlambat
```

### 1.2 Compliance Calendar Tahunan

```
JANUARI
  [ ] Sesuaikan gaji dengan UMP/UMK baru (berlaku 1 Januari)
  [ ] Update PTKP karyawan jika ada perubahan status (nikah, anak baru, dll)
  [ ] Rekonsiliasi PPh 21 tahun lalu (persiapan SPT Tahunan)
  [ ] Pastikan BPJS terdaftar untuk karyawan baru tahun lalu

FEBRUARI - MARET (tergantung tahun)
  ⚠️ PERHATIAN THR LEBARAN — Idul Fitri (tanggal bervariasi tiap tahun)
  [ ] H-30: Hitung estimasi THR semua karyawan
  [ ] H-14: Finalisasi daftar THR + dapatkan approval manajemen
  [ ] H-7: BATAS AKHIR pembayaran THR karyawan swasta (WAJIB)
  [ ] Lapor ke Disnaker setempat jika ada kesulitan bayar THR

MARET
  [ ] Batas akhir JP (Jaminan Pensiun) — update wage cap JP (biasanya berubah 1 Maret)
  [ ] JP wage cap 2026: maksimum Rp10.547.400/bulan (update jika berubah)

APRIL (atau sesuai tahun pajak)
  [ ] Deadline SPT Tahunan PPh Orang Pribadi (31 Maret)
  [ ] Distribusi bukti potong 1721-A1 ke semua karyawan (paling lambat akhir Januari)

NOVEMBER-DESEMBER
  [ ] Rekonsiliasi PPh 21 bulan Desember (mass pajak terakhir = hitung ulang dengan tarif Ps.17)
  [ ] Pantau pengumuman UMP/UMK tahun berikutnya (biasanya diumumkan 24 Desember)
  [ ] Siapkan adjustment gaji untuk 1 Januari

NATAL (25 Desember)
  [ ] THR untuk karyawan beragama Kristen — H-7 = ~18 Desember
  [ ] THR untuk karyawan beragama Hindu (Nyepi) — H-7 sebelum Nyepi
  [ ] THR untuk karyawan beragama Buddha (Waisak) — H-7 sebelum Waisak
```

**[FINE-TUNE: Update deadline THR setiap tahun berdasarkan tanggal Idul Fitri yang ditetapkan pemerintah]**

---

## BAGIAN 2: BPJS KESEHATAN

### 2.1 Iuran (Berlaku 2025-2026, PP No. 64/2020 & Perpres 59/2024)

```
KARYAWAN SWASTA (Pekerja Penerima Upah / PPU):
  Iuran total: 5% dari gaji pokok bulanan
  Ditanggung perusahaan: 4% (maksimum Rp480.000/bulan)
  Dipotong dari karyawan: 1% (maksimum Rp120.000/bulan)
  Batas atas gaji untuk kalkulasi: Rp12.000.000/bulan
  Batas bawah gaji untuk kalkulasi: UMP/UMK setempat

  Contoh kalkulasi (gaji Rp8.000.000):
    Perusahaan bayar: 4% × Rp8.000.000 = Rp320.000/bulan
    Dipotong karyawan: 1% × Rp8.000.000 = Rp80.000/bulan

  Contoh kalkulasi (gaji Rp20.000.000 — di atas cap):
    Perusahaan bayar: 4% × Rp12.000.000 = Rp480.000/bulan (capped)
    Dipotong karyawan: 1% × Rp12.000.000 = Rp120.000/bulan (capped)

TANGGUNGAN:
  Tertanggung default: karyawan + 1 pasangan + maks 3 anak (di bawah 21 tahun atau 25 jika masih sekolah)
  Anggota keluarga tambahan (anak ke-4+, orang tua, mertua):
    1% dari gaji per orang per bulan, ditanggung karyawan

KARYAWAN TIDAK BER-NPWP:
  Tidak ada perbedaan tarif BPJS Kesehatan karena NPWP

STATUS KRIS (2025-2026):
  Sistem kelas 1/2/3 sedang dalam transisi ke KRIS (Kelas Rawat Inap Standar)
  Target implementasi penuh: setelah 30 Juni 2025, tapi masih dalam evaluasi
  Tarif iuran BELUM berubah — masih menggunakan skema 4%/1%
```

### 2.2 Kewajiban Pendaftaran

```
SYARAT PENDAFTARAN BPJS KESEHATAN (untuk perusahaan):
  - Formulir pendaftaran (ttd direktur + stempel)
  - SIUP / NIB (Nomor Induk Berusaha)
  - NPWP perusahaan
  - Dokumen domisili perusahaan
  - Surat Kuasa untuk PIC BPJS

UNTUK KARYAWAN BARU:
  - Wajib didaftarkan dalam 30 hari setelah mulai bekerja
  - Dokumen: e-KTP karyawan, e-KTP pasangan (jika ada), akta nikah, akta lahir anak

SANKSI TIDAK MENDAFTARKAN KARYAWAN:
  - Teguran tertulis
  - Denda administratif
  - Tidak dapat mengurus izin usaha tertentu (laporan ke DPMPTSP)
```

---

## BAGIAN 3: BPJS KETENAGAKERJAAN

### 3.1 Program dan Tarif (Berlaku 2025-2026)

```
PROGRAM 1 — JHT (Jaminan Hari Tua)
  Perusahaan: 3,7% dari gaji
  Karyawan: 2% dari gaji
  Tidak ada batas atas gaji untuk JHT
  Manfaat: tabungan hari tua, bisa dicairkan sebagian (10% atau 30%) setelah 10 tahun
           bisa dicairkan penuh saat pensiun, cacat total, atau meninggal

  Contoh (gaji Rp5.000.000):
    Perusahaan: 3,7% × Rp5.000.000 = Rp185.000
    Karyawan: 2% × Rp5.000.000 = Rp100.000

PROGRAM 2 — JKK (Jaminan Kecelakaan Kerja)
  Ditanggung penuh oleh perusahaan (tidak ada potongan karyawan)
  Tarif berdasarkan risiko pekerjaan:
    Risiko sangat rendah (kelompok I): 0,24% dari gaji
    Risiko rendah (kelompok II): 0,54% dari gaji
    Risiko sedang (kelompok III): 0,89% dari gaji
    Risiko tinggi (kelompok IV): 1,27% dari gaji
    Risiko sangat tinggi (kelompok V): 1,74% dari gaji

  Contoh industri risiko rendah (kantor, keuangan, IT):
    Perusahaan: 0,24% × Rp5.000.000 = Rp12.000/karyawan/bulan

  ⚠️ PENTING 2025-2026: Ada relaksasi 50% untuk JKK di industri padat karya
     berlaku Agustus 2025 – Januari 2026

PROGRAM 3 — JKM (Jaminan Kematian)
  Perusahaan: 0,3% dari gaji
  Tidak ada potongan karyawan
  Manfaat: santunan Rp42.000.000 + biaya pemakaman Rp10.000.000 jika karyawan meninggal

PROGRAM 4 — JP (Jaminan Pensiun)
  Perusahaan: 2% dari gaji (maksimum dari wage cap)
  Karyawan: 1% dari gaji (maksimum dari wage cap)
  Wage cap JP: Rp10.547.400/bulan (berlaku Maret 2025 – Februari 2026)
              [FINE-TUNE: Update setiap Maret saat wage cap JP berubah]

  Contoh (gaji Rp5.000.000):
    Perusahaan: 2% × Rp5.000.000 = Rp100.000
    Karyawan: 1% × Rp5.000.000 = Rp50.000

  Contoh (gaji Rp15.000.000 — di atas cap):
    Perusahaan: 2% × Rp10.547.400 = Rp210.948 (capped)
    Karyawan: 1% × Rp10.547.400 = Rp105.474 (capped)

  Manfaat: pensiun bulanan (minimum Rp399.700 s.d. maksimum Rp4.792.300/bulan per 2025)
  Usia pensiun: 59 tahun (naik 1 tahun setiap 3 tahun, target 65 tahun di 2043)

PROGRAM 5 — JKP (Jaminan Kehilangan Pekerjaan)
  Perusahaan: tidak ada iuran tambahan (diambil dari rekomposisi iuran JHT dan subsidi pemerintah)
  Manfaat: 60% dari gaji terakhir × maksimum 6 bulan untuk karyawan yang di-PHK
  Syarat: sudah bayar iuran minimal 12 bulan dalam 24 bulan terakhir

RINGKASAN TOTAL BEBAN PERUSAHAAN (risiko rendah):
  JHT: 3,7%
  JKK: 0,24%
  JKM: 0,3%
  JP: 2% (sampai wage cap)
  Total: ~6,24% dari gaji (ditambah 4% BPJS Kesehatan = ~10,24% total beban sosial perusahaan)
```

### 3.2 Kewajiban Registrasi BPJS Ketenagakerjaan

```
DOKUMEN PENDAFTARAN PERUSAHAAN (formulir F1, F1A, F2):
  - Akta pendirian perusahaan
  - NPWP perusahaan
  - NIB / SIUP
  - e-KTP direktur
  - Daftar karyawan dan upah

UNTUK KARYAWAN BARU:
  - Wajib didaftarkan dalam 30 hari setelah mulai bekerja
  - Kartu peserta diterbitkan maksimal 7 hari setelah pembayaran pertama

PELAPORAN BULANAN — SIPP Online (sipp.bpjsketenagakerjaan.go.id):
  - Laporkan perubahan data karyawan, upah, dan kepesertaan
  - Deadline: sebelum tanggal 15 bulan berjalan
```

---

## BAGIAN 4: PPh 21 — PAJAK PENGHASILAN KARYAWAN

### 4.1 Sistem TER (Tarif Efektif Rata-rata) — Berlaku sejak 1 Januari 2024

```
DASAR HUKUM:
  PP No. 58 Tahun 2023 + PMK No. 168 Tahun 2023

CARA KERJA:
  Januari–November: Potong PPh 21 = Penghasilan Bruto × Tarif TER Bulanan
  Desember (masa pajak terakhir): Hitung ulang dengan tarif Pasal 17 UU PPh (tarif progresif tahunan)

KATEGORI TER BERDASARKAN STATUS PTKP:
  Kategori A: Status TK/0 (lajang tanpa tanggungan), TK/1, K/0
  Kategori B: Status TK/2, TK/3, K/1, K/2
  Kategori C: Status K/3 (kawin dengan 3 tanggungan)
```

### 4.2 Tabel TER Bulanan Kategori A (TK/0, TK/1, K/0)

```
Gaji Bruto/Bulan          | TER Bulanan
≤ Rp5.400.000             | 0%
Rp5.400.001 – Rp5.650.000 | 0,25%
Rp5.650.001 – Rp5.950.000 | 0,5%
Rp5.950.001 – Rp6.300.000 | 0,75%
Rp6.300.001 – Rp6.750.000 | 1%
Rp6.750.001 – Rp7.500.000 | 1,25%
Rp7.500.001 – Rp8.550.000 | 1,5%
Rp8.550.001 – Rp9.650.000 | 1,75%
Rp9.650.001 – Rp10.050.000| 2%
Rp10.050.001 – Rp10.350.000| 2,25%
Rp10.350.001 – Rp10.700.000| 2,5%
Rp10.700.001 – Rp11.050.000| 3%
Rp11.050.001 – Rp11.600.000| 3,5%
Rp11.600.001 – Rp12.500.000| 4%
Rp12.500.001 – Rp13.750.000| 5%
Rp13.750.001 – Rp15.100.000| 6%
[berlanjut...]
> Rp1.400.000.000           | 34%

CONTOH KALKULASI:
  Karyawan TK/0, gaji Rp8.000.000/bulan (Kategori A):
  TER: 1,5%
  PPh 21 per bulan (Jan–Nov): Rp8.000.000 × 1,5% = Rp120.000
```

### 4.3 PTKP (Penghasilan Tidak Kena Pajak) — Referensi untuk Desember

```
PTKP per tahun (berlaku sejak 2016, belum berubah):
  TK/0 (tidak kawin, tidak ada tanggungan): Rp54.000.000
  TK/1 (tidak kawin, 1 tanggungan):         Rp58.500.000
  TK/2 (tidak kawin, 2 tanggungan):         Rp63.000.000
  TK/3 (tidak kawin, 3 tanggungan):         Rp67.500.000
  K/0 (kawin, tidak ada tanggungan):        Rp58.500.000
  K/1 (kawin, 1 tanggungan):                Rp63.000.000
  K/2 (kawin, 2 tanggungan):               Rp67.500.000
  K/3 (kawin, 3 tanggungan):               Rp72.000.000

Tambahan per tanggungan: Rp4.500.000/orang
Maksimum tanggungan yang diakui: 3 orang
Tanggungan = anak kandung, anak angkat, saudara kandung sedarah yang jadi tanggungan penuh
```

### 4.4 Tarif Progresif Pasal 17 (untuk kalkulasi Desember & SPT Tahunan)

```
Penghasilan Kena Pajak (PKP) per tahun | Tarif
Sampai Rp60.000.000                    | 5%
Rp60.000.001 – Rp250.000.000           | 15%
Rp250.000.001 – Rp500.000.000          | 25%
Rp500.000.001 – Rp5.000.000.000        | 30%
Di atas Rp5.000.000.000                | 35%

Catatan: PKP = Penghasilan Neto Setahun – PTKP
         Penghasilan Neto = Penghasilan Bruto – Biaya Jabatan (maks 5% dari bruto, max Rp6.000.000/tahun)
```

### 4.5 Perhatian Khusus — THR dan PPh 21

```
⚠️ EFEK THR TERHADAP PPh 21:
Ketika THR dibayarkan di bulan yang sama dengan gaji, penghasilan bruto bulan itu menjadi
dua kali lipat. Ini membuat TER yang berlaku NAIK ke bracket lebih tinggi.

Contoh:
  Karyawan TK/0, gaji bulanan Rp8.000.000
  - Bulan normal: TER 1,5% → PPh 21 = Rp120.000
  - Bulan THR: gaji + THR = Rp8.000.000 + Rp8.000.000 = Rp16.000.000
  - TER untuk Rp16.000.000: ~7% → PPh 21 = Rp1.120.000 (naik drastis)

IMPLIKASI: Karyawan perlu diberi tahu sebelumnya bahwa PPh 21 di bulan THR akan lebih besar.
           Hindari komplain karyawan dengan komunikasi proaktif.
```

### 4.6 Karyawan Tanpa NPWP

```
Karyawan yang tidak memiliki NPWP dikenakan tarif PPh 21 lebih tinggi:
  Sebelum memiliki NPWP: tarif × 120% (tambahan 20%)
  
Rekomendasi: Minta semua karyawan memiliki NPWP saat onboarding.
             Proses pembuatan NPWP bisa dilakukan online di ereg.pajak.go.id
```

---

## BAGIAN 5: THR — TUNJANGAN HARI RAYA

### 5.1 Aturan Dasar

```
DASAR HUKUM: Permenaker No. 6/2016 + PP No. 36/2021

SIAPA YANG BERHAK MENERIMA THR:
  ✓ Semua karyawan PKWTT (karyawan tetap)
  ✓ Semua karyawan PKWT dengan masa kerja ≥ 1 bulan terus-menerus
  ✓ Karyawan harian lepas dengan masa kerja ≥ 1 bulan
  ✓ Karyawan PKWTT yang di-PHK dalam 30 hari sebelum hari raya
  ✗ Karyawan yang mengundurkan diri sebelum hari raya (tidak berhak)

BESARAN THR:
  Masa kerja ≥ 12 bulan: 1 bulan gaji penuh
  Masa kerja 1–11 bulan: (masa kerja dalam bulan ÷ 12) × 1 bulan gaji
    Contoh: karyawan masa kerja 8 bulan → 8/12 × gaji = 0,667 × gaji

KOMPONEN GAJI UNTUK THR:
  Yang termasuk: gaji pokok + tunjangan tetap
  Yang TIDAK termasuk: tunjangan tidak tetap (uang makan, transportasi harian, lembur)

HARI RAYA YANG BERLAKU:
  Idul Fitri   → untuk karyawan beragama Islam
  Natal (25/12) → untuk karyawan beragama Kristen
  Nyepi        → untuk karyawan beragama Hindu
  Waisak       → untuk karyawan beragama Buddha
  Imlek        → untuk karyawan beragama Konghucu
```

### 5.2 Deadline dan Sanksi

```
DEADLINE PEMBAYARAN:
  H-7 sebelum hari raya (dihitung dari tanggal hari raya, mundur 7 hari kalender)
  Untuk Idul Fitri 2026: 13 Maret 2026 (berdasarkan info tersedia — VERIFY dengan kalender resmi)
  [FINE-TUNE: Update deadline THR setiap tahun]

SANKSI KETERLAMBATAN:
  Denda: 5% dari total THR yang harus dibayar
  Denda dihitung sejak H-7 berlalu
  Denda TIDAK menghapus kewajiban membayar THR pokok

SANKSI TIDAK MEMBAYAR SAMA SEKALI:
  1. Teguran tertulis dari Disnaker
  2. Pembatasan kegiatan usaha
  3. Penghentian sementara sebagian/seluruh alat produksi
  4. Pembekuan kegiatan usaha

KETENTUAN PENTING:
  - THR TIDAK BOLEH DICICIL (harus dibayar penuh sekaligus)
  - Jika perusahaan tidak mampu bayar, wajib lapor Disnaker sebelum deadline
  - Pengaduan karyawan: poskothr.kemnaker.go.id
```

---

## BAGIAN 6: UPAH MINIMUM 2026

### 6.1 UMP 2026 (berlaku 1 Januari 2026)

```
DASAR HUKUM: PP No. 49 Tahun 2025 tentang Pengupahan

UMP 2026 — PROVINSI UTAMA:
  DKI Jakarta:           Rp5.729.876  (naik 6,17% dari 2025)
  Banten:                Rp3.100.811  (naik 6,74%)
  Jawa Barat:            Rp2.317.601  (naik 5,77%) ← UMP terendah
  Jawa Tengah:           Rp2.327.386  (naik 7,28%)
  DI Yogyakarta:         Rp2.417.495  (naik 6,78%)
  Jawa Timur:            Rp2.446.880  (naik 6,11%)
  Bali:                  Rp3.207.459  (naik 7,04%)
  Sumatera Utara:        Rp3.000.000+ (naik ~7,9%)
  Riau:                  Rp3.500.000+ (perkiraan)
  Kalimantan Timur:      Rp3.762.431  (naik 5,12%)
  Sulawesi Selatan:      Rp3.921.088
  Papua (Selatan/dll):   Rp3.700.000+

UMP TERTINGGI: DKI Jakarta — Rp5.729.876
UMP TERENDAH: Jawa Barat — Rp2.317.601
RATA-RATA NASIONAL: sekitar Rp3.400.000

CATATAN: UMK (Kabupaten/Kota) biasanya lebih tinggi dari UMP di beberapa daerah industri.
         Selalu cek SK Gubernur/Bupati/Walikota untuk angka yang berlaku di lokasi kamu.
```

### 6.2 Aturan Upah Minimum

```
SIAPA YANG DILINDUNGI:
  - Karyawan dengan masa kerja < 1 tahun
  - Karyawan masa kerja ≥ 1 tahun boleh dibayar di atas upah minimum (struktur & skala upah)

YANG TIDAK BOLEH DILAKUKAN:
  - Membayar di bawah UMP/UMK (pelanggaran = sanksi pidana Pasal 185 UU Ketenagakerjaan)
  - "Menyiasati" UMP dengan memindahkan komponen gaji ke tunjangan tidak tetap
  - Memotong gaji karyawan sampai di bawah UMP atas nama apapun

STRUKTUR & SKALA UPAH:
  Wajib dibuat untuk perusahaan dengan > 10 karyawan atau total gaji > UMP
  Harus mendaftarkan struktur & skala upah ke Disnaker setempat
```

---

## BAGIAN 7: JENIS KONTRAK KERJA — PKWT & PKWTT

### 7.1 PKWT (Perjanjian Kerja Waktu Tertentu) — Kontrak

```
DASAR HUKUM: PP No. 35 Tahun 2021 (turunan UU Cipta Kerja)

BOLEH DIGUNAKAN UNTUK:
  ✓ Pekerjaan yang diperkirakan selesai dalam waktu tertentu
  ✓ Pekerjaan bersifat musiman
  ✓ Pekerjaan berhubungan dengan produk/kegiatan baru yang masih percobaan
  ✓ Pekerjaan yang sekali selesai atau sementara

TIDAK BOLEH DIGUNAKAN UNTUK:
  ✗ Pekerjaan yang bersifat tetap dan terus-menerus
  ✗ Pekerjaan inti (core business) yang tidak ada batasnya
  → Jika dilanggar: status otomatis berubah jadi PKWTT (karyawan tetap)

DURASI MAKSIMUM:
  Maksimum 5 tahun (total termasuk perpanjangan)
  Perpanjangan hanya dapat dilakukan 1 kali, SEBELUM kontrak pertama berakhir
  Jika perpanjangan dilakukan setelah kontrak berakhir → otomatis jadi PKWTT

FORMALITAS WAJIB:
  ✓ Harus tertulis, dalam Bahasa Indonesia, huruf latin
  ✓ Wajib dicatatkan ke Disnaker dalam 3 hari kerja setelah ditandatangani
  ✓ Kontrak lisan = otomatis PKWTT

HAK KARYAWAN PKWT:
  ✓ Upah minimum (sama dengan karyawan tetap)
  ✓ THR (proporsional jika < 12 bulan)
  ✓ BPJS Kesehatan dan Ketenagakerjaan
  ✓ Cuti tahunan 12 hari setelah 12 bulan kerja
  ✓ Uang kompensasi saat kontrak berakhir (BARU sejak UU Cipta Kerja)

UANG KOMPENSASI PKWT (berlaku sejak PP 35/2021):
  Masa kerja 12 bulan atau lebih: 1 bulan upah
  Masa kerja 1–11 bulan: (masa kerja ÷ 12) × 1 bulan upah
  Pemutusan sebelum kontrak berakhir oleh perusahaan:
    → Uang kompensasi + ganti rugi sisa kontrak (50% dari gaji × sisa masa kontrak)
```

### 7.2 PKWTT (Perjanjian Kerja Waktu Tidak Tertentu) — Karyawan Tetap

```
KARAKTERISTIK:
  - Tidak ada batas waktu
  - Digunakan untuk pekerjaan yang bersifat tetap dan berkelanjutan
  - Masa percobaan (probation) maksimum 3 bulan
  - Selama probation: karyawan tetap berhak atas upah minimum, BPJS, dan tidak boleh di-PHK tanpa alasan

HAK KARYAWAN PKWTT:
  ✓ Semua hak karyawan PKWT
  ✓ Pesangon saat PHK (bukan kompensasi)
  ✓ Perlindungan lebih dari PHK sewenang-wenang

PESANGON PKWTT (Formula dasar, Pasal 156 UU Ketenagakerjaan):
  Masa kerja < 1 tahun: 1 bulan upah
  Masa kerja 1–2 tahun: 2 bulan upah
  Masa kerja 2–3 tahun: 3 bulan upah
  Masa kerja 3–4 tahun: 4 bulan upah
  Masa kerja 4–5 tahun: 5 bulan upah
  Masa kerja 5–6 tahun: 6 bulan upah
  Masa kerja 6–7 tahun: 7 bulan upah
  Masa kerja 7–8 tahun: 8 bulan upah
  Masa kerja ≥ 8 tahun: 9 bulan upah

  PLUS Uang Penghargaan Masa Kerja (UPMK):
  Masa kerja 3–6 tahun: 2 bulan upah
  Masa kerja 6–9 tahun: 3 bulan upah
  Masa kerja 9–12 tahun: 4 bulan upah
  Masa kerja 12–15 tahun: 5 bulan upah
  [dst...]

  PLUS Uang Penggantian Hak (cuti yang belum diambil, dll)

  CATATAN: Formula pesangon berubah dengan UU Cipta Kerja
  Untuk PHK dengan alasan tertentu, pelipatgandaan berbeda (1× atau 0,5× tergantung alasan)
  [FINE-TUNE: Tambahkan tabel multiplier pesangon berdasarkan alasan PHK]
```

### 7.3 Common Mistakes & Risk Flags

```
RISIKO TINGGI yang perlu agent deteksi dan alert:

❌ PKWT untuk pekerjaan tetap
   Risiko: otomatis jadi PKWTT + potensi tuntutan pesangon
   Indikator: karyawan PKWT sudah > 3 tahun di posisi yang sama

❌ PKWT tidak dicatatkan ke Disnaker
   Risiko: kontrak tidak sah, karyawan bisa klaim jadi PKWTT
   Indikator: PKWT baru tidak ada bukti pencatatan dalam 3 hari kerja

❌ Perpanjangan PKWT setelah kontrak berakhir
   Risiko: status otomatis berubah ke PKWTT
   Indikator: ada gap antara tanggal kontrak berakhir dan tanggal perpanjangan

❌ PKWT melebihi total 5 tahun
   Risiko: pelanggaran hukum, karyawan jadi PKWTT dengan klaim pesangon
   Indikator: total durasi kontrak + perpanjangan > 60 bulan

❌ Tidak ada kontrak tertulis
   Risiko: otomatis dianggap PKWTT
```

---

## BAGIAN 8: ALUR KERJA AGENT — COMPLIANCE MONITORING

### 8.1 Routine Compliance Checks

```
HARIAN (via Supabase query):
  - Cek karyawan baru yang belum terdaftar BPJS (belum 30 hari dari join date)
  - Cek PKWT yang akan berakhir dalam 30 hari ke depan
  - Cek PKWT yang total durasinya mendekati 5 tahun

MINGGUAN:
  - Summary compliance status ke HRD setiap Senin
  - Flag item yang urgent (< 7 hari dari deadline)

BULANAN (sesuai kalender):
  - Tanggal 8: Reminder BPJS Kesehatan (deadline tanggal 10)
  - Tanggal 13: Reminder BPJS Ketenagakerjaan (deadline tanggal 15)
  - Tanggal 13: Reminder penyetoran PPh 21 (deadline tanggal 15)
  - Tanggal 18: Reminder pelaporan SPT Masa PPh 21 (deadline tanggal 20)

THR ALERTS:
  H-30: Alert pertama "Persiapkan estimasi THR"
  H-14: Alert "Finalisasi daftar & ajukan approval"
  H-7: Alert kritis "HARI INI batas akhir pembayaran THR"
  H-7+1: Alert denda "THR terlambat, denda 5% mulai berlaku"
```

### 8.2 Response Templates untuk HRD

```
TEMPLATE ALERT BULANAN (kirim via WhatsApp):
"📋 *Compliance Reminder — [BULAN TAHUN]*

Deadline minggu ini:
⏰ [Tanggal]: BPJS Kesehatan — Rp[TOTAL]/bulan
⏰ [Tanggal]: BPJS Ketenagakerjaan — Rp[TOTAL]/bulan
⏰ [Tanggal]: PPh 21 setoran

⚠️ Items yang butuh perhatian:
[DAFTAR FLAGS jika ada]

Ketik 'detail' untuk rincian per karyawan."

TEMPLATE ALERT THR (H-14):
"🎊 *THR Alert — [HARI RAYA] [TAHUN]*

Batas akhir pembayaran: [TANGGAL] (H-7)

Summary THR:
• Total karyawan berhak: [JUMLAH]
• Total kewajiban: Rp[TOTAL]
• Karyawan proporsional (< 12 bulan): [JUMLAH]

Perlu approval segera. Balas 'detail' untuk breakdown per karyawan."

TEMPLATE PKWT EXPIRY ALERT:
"⚠️ *Kontrak PKWT Segera Berakhir*

[NAMA] - [JABATAN]
Kontrak berakhir: [TANGGAL] ([X] hari lagi)
Total durasi sejauh ini: [X] bulan

Opsi:
1. Perpanjang PKWT (jika total belum 5 tahun dan pekerjaan masih sementara)
2. Angkat jadi PKWTT (karyawan tetap)
3. Akhiri kontrak (siapkan uang kompensasi)

Perlu action segera untuk hindari PKWT berubah otomatis ke PKWTT."
```

---

## BAGIAN 9: FAQ COMPLIANCE — PERTANYAAN UMUM HRD

### Pertanyaan Umum yang Sering Muncul

```
Q: Karyawan baru join tanggal 15, kapan harus didaftarkan BPJS?
A: Harus didaftarkan paling lambat 30 hari setelah tanggal join, yaitu tanggal 14 bulan berikutnya.
   Lebih cepat lebih baik — daftarkan di hari pertama masuk kerja.

Q: Karyawan mengundurkan diri sebelum lebaran, apakah dapat THR?
A: Tidak berhak, KECUALI karyawan PKWTT yang di-PHK dalam 30 hari sebelum hari raya masih berhak.
   Karyawan yang mengundurkan diri sendiri (resign) sebelum hari raya tidak dapat THR.

Q: Bolehkah bayar THR dicicil karena kondisi keuangan perusahaan?
A: TIDAK BOLEH. THR harus dibayar penuh sekaligus.
   Jika benar-benar tidak mampu, perusahaan harus proaktif lapor ke Disnaker sebelum deadline
   untuk mendapatkan kebijakan khusus. Jangan tunggu sampai kena sanksi.

Q: Karyawan belum punya NPWP, berapa PPh 21-nya?
A: Tarif TER normal × 1,2 (tambahan 20%). Dorong karyawan segera buat NPWP.
   Cara buat NPWP online: ereg.pajak.go.id (gratis, bisa dari HP)

Q: PKWT sudah 3 tahun, bisa diperpanjang lagi?
A: Bisa, selama total kontrak tidak melebihi 5 tahun. Perpanjangan hanya bisa 1 kali
   dan HARUS dilakukan sebelum kontrak lama berakhir.
   Contoh: kontrak 3 tahun → perpanjang 2 tahun lagi = total 5 tahun (batas maksimum).

Q: Apa bedanya uang kompensasi PKWT dengan pesangon PKWTT?
A: Kompensasi PKWT: diberikan saat kontrak berakhir secara normal. Besarnya 1 bulan gaji per 12 bulan kerja.
   Pesangon PKWTT: diberikan saat ada PHK (diberhentikan). Besarnya lebih besar dan ada UPMK tambahan.
   Karyawan PKWT yang kontraknya tidak diperpanjang = hak kompensasi, BUKAN pesangon.

Q: Karyawan bekerja di kantor pusat Jakarta tapi domisili di Bekasi, UMP mana yang berlaku?
A: Berlaku UMP/UMK dari lokasi perusahaan (tempat kerja), bukan domisili karyawan.
   Jika kantor di Jakarta → berlaku UMP DKI Jakarta.
   Jika pabrik di Bekasi → berlaku UMK Bekasi.
```

---

## BAGIAN 10: LEGAL REFERENCES

```
PERATURAN UTAMA:
  UU No. 13/2003          — Ketenagakerjaan (masih berlaku, beberapa pasal diubah Omnibus Law)
  UU No. 11/2020          — Cipta Kerja (Omnibus Law) dan UU No. 6/2023 (Perppu jadi UU)
  PP No. 35/2021          — PKWT, Waktu Kerja, PHK
  PP No. 36/2021          — Pengupahan (termasuk sanksi THR)
  PP No. 45/2015          — Jaminan Pensiun (usia pensiun 59 tahun mulai 2025)
  Permenaker No. 6/2016   — THR Keagamaan
  PP No. 58/2023          — Tarif TER PPh 21
  PMK No. 168/2023        — Petunjuk Pelaksanaan PPh 21 TER
  PP No. 49/2025          — Pengupahan (formula UMP 2026)

SUMBER RESMI UNTUK CEK INFO TERBARU:
  pajak.go.id             — PPh 21, e-Filing, e-Billing
  bpjs-kesehatan.go.id    — BPJS Kesehatan
  bpjsketenagakerjaan.go.id — BPJS Ketenagakerjaan, SIPP Online
  kemnaker.go.id          — Kemenaker, THR, ketenagakerjaan
  jdih.setkab.go.id       — Basis data peraturan resmi pemerintah
```

---

## CATATAN IMPLEMENTASI

### Untuk Agent

```
PRINSIP UTAMA:
1. Selalu sertakan disclaimer "konsultasikan dengan konsultan/akuntan untuk kasus spesifik"
2. Untuk pertanyaan angka (berapa PPh 21, berapa BPJS), berikan rumus + contoh konkret
3. Untuk pertanyaan legal (boleh/tidak, sanksi apa), cite pasal hukum yang relevan
4. Jika ada ambiguitas, selalu rekomendasikan opsi yang lebih aman untuk karyawan

FLAG UNTUK ESKALASI KE HRD/KONSULTAN HUKUM:
- PHK massal (lebih dari 10 karyawan sekaligus)
- Sengketa perselisihan industrial
- Kasus dimana karyawan sudah ancam lapor ke Disnaker
- Situasi PKWT yang sudah borderline jadi PKWTT
- Pertanyaan tentang outsourcing/alih daya

DATA SUPABASE yang perlu di-query untuk compliance check:
  employees: join_date, contract_type, contract_end_date, salary, bpjs_registered, npwp_status
  compliance_calendar: upcoming_deadlines, status, tenant_id
```

### Data yang Perlu Update Berkala

```
[FINE-TUNE checklist — update setiap:

TAHUNAN (Januari):
  - UMP/UMK seluruh provinsi (berlaku 1 Januari)
  - Usia pensiun JP (naik 1 tahun setiap 3 tahun)

TAHUNAN (sesuai jadwal):
  - Deadline THR berdasarkan tanggal Idul Fitri/Natal/Nyepi/Waisak

SETIAP MARET:
  - Wage cap JP BPJS Ketenagakerjaan (biasanya update Maret)
  - Wage cap 2026: Rp10.547.400 (berlaku Maret 2025 – Februari 2026)

KETIKA ADA REGULASI BARU:
  - Tarif BPJS (jika ada perubahan)
  - Skema PPh 21 (jika ada perubahan PP/PMK)
  - Ketentuan THR (Surat Edaran Menaker tahunan)
  - PTKP (belum berubah sejak 2016, monitor jika ada perubahan)
]
```

---

*SKILL.md ini adalah DRAFT v1. Data verified per Maret 2026.*
*Selalu cross-check dengan sumber resmi sebelum membuat keputusan yang berdampak besar.*
*Lihat marker [FINE-TUNE] untuk area yang perlu update berkala.*

