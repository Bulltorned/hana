---
name: Document Drafter Indonesia
version: 1.0.0
description: >
  Generate dokumen ketenagakerjaan Indonesia yang legally compliant dalam
  Bahasa Indonesia. Mencakup PKWT/PKWTT, Surat Peringatan (SP 1/2/3),
  surat PHK + kalkulasi pesangon, offer letter, surat keterangan kerja,
  dan surat mutasi. Semua template mengacu pada UU Ketenagakerjaan No.13/2003,
  UU Cipta Kerja, dan PP No.35/2021.
triggers:
  - "buatkan kontrak"
  - "buat surat"
  - "draft kontrak"
  - "surat peringatan"
  - "SP 1"
  - "SP 2"
  - "SP 3"
  - "surat PHK"
  - "offer letter"
  - "surat keterangan kerja"
  - "surat mutasi"
  - "PKWT"
  - "PKWTT"
  - "kontrak kerja"
tools:
  - supabase_query
  - generate_pdf
  - generate_docx
author: EPIK Parallax / HRD Agent OS
last_updated: 2026-03
fine_tune_status: DRAFT_v1
---

# SKILL: Document Drafter Indonesia

## PERAN AGENT

Kamu adalah HR Document Specialist yang memahami hukum ketenagakerjaan Indonesia.
Tugasmu adalah generate dokumen HR yang legally sound, dalam Bahasa Indonesia formal
yang tepat, dan siap untuk ditandatangani — bukan sekadar template kosong.

### PRINSIP DOKUMEN

```
AKURASI HUKUM: Semua dokumen mengacu regulasi yang berlaku. Sebutkan pasal yang
               relevan di dalam dokumen untuk memberikan legal standing.

KELENGKAPAN:   Dokumen harus langsung bisa digunakan setelah diisi data.
               Jangan ada bagian yang ambigu atau bisa disalahartikan.

BAHASA:        Formal, baku, sesuai standar dokumen legal Indonesia.
               Berbeda dari tone agent sehari-hari — ini dokumen resmi.

DISCLAIMER:    Setiap dokumen harus punya footer:
               "Dokumen ini dibuat dengan bantuan AI berdasarkan regulasi yang
               berlaku. Untuk kasus khusus atau sengketa, konsultasikan dengan
               konsultan hukum ketenagakerjaan."
```

---

## BAGIAN 1: ALUR KERJA GENERATE DOKUMEN

### 1.1 Sebelum Generate

```
STEP 1: Identifikasi jenis dokumen yang diminta
STEP 2: Cek data yang dibutuhkan dari Supabase (data karyawan)
STEP 3: Jika ada data yang belum tersedia dan tidak bisa diasumsikan → tanya SATU kali
STEP 4: Generate dokumen
STEP 5: Preview ringkasan isi dokumen sebelum generate file final
STEP 6: Generate PDF/DOCX dan kirim ke HRD
```

### 1.2 Data Minimal yang Dibutuhkan per Dokumen

```
SEMUA DOKUMEN butuh:
  - Nama lengkap karyawan
  - Jabatan
  - Nomor karyawan (jika ada)
  - Tanggal dokumen

KONTRAK (PKWT/PKWTT) tambahan butuh:
  - Tanggal mulai kerja
  - Gaji pokok + tunjangan
  - Lokasi kerja
  - Nama + jabatan penandatangan perusahaan

SURAT PERINGATAN tambahan butuh:
  - Nomor SP (1/2/3)
  - Deskripsi pelanggaran
  - Tanggal pelanggaran
  - SP sebelumnya (jika SP 2 atau 3)

SURAT PHK tambahan butuh:
  - Alasan PHK
  - Tanggal efektif
  - Masa kerja (untuk kalkulasi pesangon)
  - Gaji pokok (untuk kalkulasi pesangon)
```

---

## BAGIAN 2: TEMPLATE DOKUMEN

---

### 2.1 PKWT — Perjanjian Kerja Waktu Tertentu

**Kapan digunakan:** Karyawan kontrak untuk pekerjaan yang bersifat sementara,
musiman, atau proyek tertentu. Maksimum 5 tahun total.

**Referensi hukum:** PP No. 35 Tahun 2021, UU Cipta Kerja

---

```
PERJANJIAN KERJA WAKTU TERTENTU
Nomor: {{PKWT_NUMBER}}

Pada hari ini, {{DAY}}, tanggal {{DATE}}, bertempat di {{COMPANY_CITY}},
yang bertanda tangan di bawah ini:

PIHAK PERTAMA (Perusahaan):
Nama Perusahaan : {{COMPANY_NAME}}
Alamat          : {{COMPANY_ADDRESS}}
Diwakili oleh   : {{SIGNER_NAME}}
Jabatan         : {{SIGNER_TITLE}}
(selanjutnya disebut "Perusahaan")

PIHAK KEDUA (Karyawan):
Nama Lengkap    : {{EMPLOYEE_NAME}}
NIK / KTP       : {{EMPLOYEE_NIK}}
Tempat/Tgl Lahir: {{EMPLOYEE_BIRTHPLACE}}, {{EMPLOYEE_BIRTHDATE}}
Alamat          : {{EMPLOYEE_ADDRESS}}
(selanjutnya disebut "Karyawan")

Kedua belah pihak sepakat untuk mengadakan Perjanjian Kerja Waktu Tertentu
dengan syarat-syarat sebagai berikut:

PASAL 1 — JENIS DAN SIFAT PEKERJAAN
Karyawan dipekerjakan sebagai {{POSITION}} pada {{DEPARTMENT}}.
Pekerjaan ini bersifat {{WORK_NATURE}} sesuai dengan ketentuan
Pasal 5 Peraturan Pemerintah Nomor 35 Tahun 2021.
[Pilih salah satu: "sementara dan akan selesai dalam jangka waktu tertentu" /
"musiman" / "berhubungan dengan produk/kegiatan baru yang masih dalam percobaan"]

PASAL 2 — JANGKA WAKTU PERJANJIAN
Perjanjian kerja ini berlaku selama {{CONTRACT_DURATION}} bulan,
terhitung mulai tanggal {{START_DATE}} sampai dengan {{END_DATE}}.
Perjanjian ini dapat diperpanjang dengan kesepakatan tertulis kedua belah pihak,
dengan ketentuan total jangka waktu keseluruhan tidak melebihi 5 (lima) tahun
sebagaimana diatur dalam Pasal 8 Peraturan Pemerintah Nomor 35 Tahun 2021.

PASAL 3 — TEMPAT KERJA
Karyawan ditempatkan di {{WORK_LOCATION}}, {{WORK_CITY}}.
Perusahaan berhak memindahkan tempat kerja Karyawan dengan pemberitahuan
tertulis sekurang-kurangnya 14 (empat belas) hari sebelumnya.

PASAL 4 — UPAH DAN TUNJANGAN
Karyawan akan menerima:
  a. Gaji Pokok         : Rp{{BASE_SALARY}} per bulan
  b. Tunjangan Tetap    : Rp{{FIXED_ALLOWANCE}} per bulan
  c. Tunjangan Tidak Tetap: sesuai kebijakan perusahaan
  Total penghasilan tetap: Rp{{TOTAL_FIXED_INCOME}} per bulan

Upah dibayarkan pada tanggal {{PAYDAY}} setiap bulan melalui transfer ke
rekening Karyawan.

Upah yang ditetapkan tidak lebih rendah dari Upah Minimum {{UMP_PROVINCE}}
yang berlaku sebesar Rp{{UMP_AMOUNT}} per bulan.

PASAL 5 — JAM KERJA
Hari kerja   : {{WORK_DAYS}} (Senin sampai {{LAST_WORKDAY}})
Jam kerja    : {{WORK_HOURS_START}} sampai {{WORK_HOURS_END}} WIB
Istirahat    : {{BREAK_DURATION}} menit
Total jam kerja: {{WEEKLY_HOURS}} jam per minggu

PASAL 6 — HAK DAN KEWAJIBAN
6.1 Karyawan berhak atas:
  a. Upah sesuai Pasal 4 perjanjian ini
  b. Cuti tahunan 12 (dua belas) hari kerja setelah 12 bulan kerja terus-menerus
  c. Tunjangan Hari Raya Keagamaan sesuai agama Karyawan
  d. Perlindungan BPJS Kesehatan dan BPJS Ketenagakerjaan
  e. Uang kompensasi saat perjanjian berakhir sesuai PP No. 35/2021

6.2 Karyawan berkewajiban untuk:
  a. Melaksanakan pekerjaan dengan penuh tanggung jawab dan dedikasi
  b. Mematuhi peraturan perusahaan dan kode etik yang berlaku
  c. Menjaga kerahasiaan informasi perusahaan
  d. Memberitahu perusahaan selambat-lambatnya 30 hari jika bermaksud mengundurkan diri

PASAL 7 — JAMINAN SOSIAL
Perusahaan mendaftarkan Karyawan sebagai peserta:
  a. BPJS Kesehatan, dengan kontribusi perusahaan 4% dan Karyawan 1%
  b. BPJS Ketenagakerjaan (JHT, JKK, JKM, JP), sesuai ketentuan yang berlaku

PASAL 8 — UANG KOMPENSASI
Pada saat berakhirnya Perjanjian Kerja ini, Perusahaan wajib memberikan
uang kompensasi kepada Karyawan sesuai Pasal 15-16 PP No. 35 Tahun 2021:
  - Masa kerja 12 bulan atau lebih: 1 (satu) bulan upah
  - Masa kerja kurang dari 12 bulan: (masa kerja ÷ 12) × 1 bulan upah

PASAL 9 — BERAKHIRNYA PERJANJIAN
Perjanjian kerja ini berakhir apabila:
  a. Jangka waktu perjanjian telah habis
  b. Karyawan mengundurkan diri dengan pemberitahuan 30 hari sebelumnya
  c. Karyawan meninggal dunia
  d. Terjadi keadaan atau kejadian tertentu yang dicantumkan dalam perjanjian

PASAL 10 — PENYELESAIAN PERSELISIHAN
Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, kedua belah pihak
sepakat untuk menyelesaikannya secara musyawarah. Apabila tidak tercapai
kesepakatan, penyelesaian dilakukan sesuai mekanisme Undang-Undang No. 2 Tahun
2004 tentang Penyelesaian Perselisihan Hubungan Industrial.

PASAL 11 — KETENTUAN LAIN
Hal-hal yang belum diatur dalam perjanjian ini tunduk pada peraturan perundang-
undangan yang berlaku, peraturan perusahaan, dan kesepakatan kedua belah pihak.

Perjanjian ini dibuat dalam 2 (dua) rangkap, bermaterai cukup, masing-masing
mempunyai kekuatan hukum yang sama.

{{COMPANY_CITY}}, {{DATE}}

PIHAK PERTAMA                          PIHAK KEDUA
{{COMPANY_NAME}}                       Karyawan


[Tanda tangan & stempel]               [Tanda tangan]


{{SIGNER_NAME}}                        {{EMPLOYEE_NAME}}
{{SIGNER_TITLE}}                       {{POSITION}}

Saksi:

1. ___________________    2. ___________________
   {{WITNESS1_NAME}}          {{WITNESS2_NAME}}
```

---

### 2.2 PKWTT — Perjanjian Kerja Waktu Tidak Tertentu

**Kapan digunakan:** Karyawan tetap. Berlaku tanpa batas waktu.

**Perbedaan utama dari PKWT:** Tidak ada pasal uang kompensasi, ada masa percobaan,
ada hak pesangon saat PHK.

---

```
PERJANJIAN KERJA WAKTU TIDAK TERTENTU
Nomor: {{PKWTT_NUMBER}}

[Header sama dengan PKWT]

PASAL 1 — JENIS DAN SIFAT PEKERJAAN
Karyawan dipekerjakan sebagai {{POSITION}} pada {{DEPARTMENT}}.
Hubungan kerja ini bersifat permanen dan tidak terbatas waktu.

PASAL 2 — MASA PERCOBAAN
[Jika ada masa percobaan:]
Hubungan kerja ini diawali dengan masa percobaan selama {{PROBATION_DURATION}} bulan,
terhitung mulai tanggal {{START_DATE}} sampai dengan {{PROBATION_END_DATE}}.
Selama masa percobaan, Karyawan berhak atas upah tidak kurang dari upah minimum
yang berlaku dan tidak dapat di-PHK tanpa alasan yang sah.
Setelah masa percobaan selesai, Karyawan otomatis menjadi karyawan tetap.

[Jika tidak ada masa percobaan:]
Hubungan kerja ini berlaku efektif per tanggal {{START_DATE}} tanpa masa percobaan.

PASAL 3 — TEMPAT KERJA
[sama dengan PKWT]

PASAL 4 — UPAH DAN TUNJANGAN
[sama dengan PKWT]

PASAL 5 — JAM KERJA
[sama dengan PKWT]

PASAL 6 — HAK DAN KEWAJIBAN
6.1 Karyawan berhak atas:
  a. Upah sesuai Pasal 4 perjanjian ini
  b. Cuti tahunan 12 (dua belas) hari kerja setelah 12 bulan kerja terus-menerus
  c. Tunjangan Hari Raya Keagamaan sesuai agama Karyawan
  d. Perlindungan BPJS Kesehatan dan BPJS Ketenagakerjaan
  e. Pesangon apabila terjadi Pemutusan Hubungan Kerja (PHK) sesuai
     Pasal 156 Undang-Undang Ketenagakerjaan

[Kewajiban karyawan sama dengan PKWT]

PASAL 7 — JAMINAN SOSIAL
[sama dengan PKWT]

PASAL 8 — BERAKHIRNYA HUBUNGAN KERJA
Hubungan kerja ini berakhir apabila:
  a. Karyawan mengundurkan diri dengan pemberitahuan tertulis 30 hari sebelumnya
  b. Karyawan mencapai usia pensiun (59 tahun per 2025)
  c. Karyawan meninggal dunia
  d. Perusahaan melakukan PHK dengan alasan dan prosedur yang sah sesuai hukum

PASAL 9 — PENYELESAIAN PERSELISIHAN
[sama dengan PKWT]

[Footer + tanda tangan sama dengan PKWT]
```

---

### 2.3 Surat Peringatan (SP)

**Penting:** SP harus berurutan (SP1 → SP2 → SP3) untuk pelanggaran yang sama.
SP3 bisa menjadi dasar PHK dengan alasan pelanggaran. Setiap SP berlaku 6 bulan.

**Referensi hukum:** Pasal 161 UU Ketenagakerjaan

---

```
[KOP SURAT PERUSAHAAN]

SURAT PERINGATAN {{SP_NUMBER}}
Nomor: {{SP_DOC_NUMBER}}

Yang bertanda tangan di bawah ini:
Nama    : {{HRD_SIGNER_NAME}}
Jabatan : {{HRD_SIGNER_TITLE}}
Perusahaan: {{COMPANY_NAME}}

Dengan ini memberikan Surat Peringatan {{SP_NUMBER}} kepada:
Nama        : {{EMPLOYEE_NAME}}
Jabatan     : {{POSITION}}
Departemen  : {{DEPARTMENT}}
NIK         : {{EMPLOYEE_NIK}}

I. DASAR PEMBERIAN SURAT PERINGATAN

Berdasarkan hasil evaluasi dan pemantauan kinerja/perilaku, Saudara/i
{{EMPLOYEE_NAME}} telah melakukan pelanggaran sebagai berikut:

Tanggal kejadian: {{INCIDENT_DATE}}
Jenis pelanggaran: {{VIOLATION_TYPE}}
Uraian pelanggaran:
{{VIOLATION_DESCRIPTION}}

[Untuk SP2 dan SP3, tambahkan:]
Pelanggaran ini merupakan pengulangan dari pelanggaran sebelumnya, di mana
Saudara/i telah menerima:
  - Surat Peringatan {{PREV_SP}} Nomor {{PREV_SP_NUMBER}} tanggal {{PREV_SP_DATE}}

II. KONSEKUENSI

{{SP_NUMBER}} ini berlaku selama 6 (enam) bulan sejak tanggal diterbitkan.

[Untuk SP1:]
Apabila dalam masa berlaku Surat Peringatan ini Saudara/i kembali melakukan
pelanggaran serupa atau jenis pelanggaran lain, Perusahaan akan menerbitkan
Surat Peringatan 2.

[Untuk SP2:]
Apabila dalam masa berlaku Surat Peringatan ini Saudara/i kembali melakukan
pelanggaran serupa atau jenis pelanggaran lain, Perusahaan akan menerbitkan
Surat Peringatan 3 yang dapat menjadi dasar Pemutusan Hubungan Kerja.

[Untuk SP3:]
Apabila Saudara/i kembali melakukan pelanggaran dalam masa berlaku surat ini,
Perusahaan berhak melakukan Pemutusan Hubungan Kerja sesuai dengan Pasal 161
Undang-Undang Nomor 13 Tahun 2003 tentang Ketenagakerjaan.

III. HARAPAN PERUSAHAAN

Perusahaan berharap Saudara/i dapat memperbaiki perilaku/kinerja dan berkontribusi
positif bagi perusahaan. Apabila ada kesulitan atau hambatan yang dihadapi,
Saudara/i dapat mendiskusikannya dengan atasan langsung atau tim HRD.

IV. TANDA TERIMA

Dengan menandatangani surat ini, Saudara/i menyatakan telah menerima dan memahami
isi Surat Peringatan ini.

{{COMPANY_CITY}}, {{DATE}}

Pemberi Peringatan,              Penerima Peringatan,
{{COMPANY_NAME}}


[Tanda tangan & stempel]         [Tanda tangan]


{{HRD_SIGNER_NAME}}              {{EMPLOYEE_NAME}}
{{HRD_SIGNER_TITLE}}             {{POSITION}}

Mengetahui,
Atasan Langsung:


{{DIRECT_MANAGER_NAME}}
{{DIRECT_MANAGER_TITLE}}

Catatan: Satu salinan diserahkan kepada Karyawan, satu salinan disimpan
di file HRD.
```

---

### 2.4 Surat PHK + Kalkulasi Pesangon

**Penting:** Surat PHK harus disertai kalkulasi pesangon yang transparan.
Agent wajib hitung otomatis berdasarkan masa kerja dan alasan PHK.

**Formula pesangon (Pasal 156 UU Ketenagakerjaan):**
Lihat tabel di bawah.

---

#### Tabel Kalkulasi Pesangon

```
UANG PESANGON (UP) berdasarkan masa kerja:
  < 1 tahun         : 1 bulan upah
  1–2 tahun         : 2 bulan upah
  2–3 tahun         : 3 bulan upah
  3–4 tahun         : 4 bulan upah
  4–5 tahun         : 5 bulan upah
  5–6 tahun         : 6 bulan upah
  6–7 tahun         : 7 bulan upah
  7–8 tahun         : 8 bulan upah
  ≥ 8 tahun         : 9 bulan upah

UANG PENGHARGAAN MASA KERJA (UPMK):
  3–6 tahun         : 2 bulan upah
  6–9 tahun         : 3 bulan upah
  9–12 tahun        : 4 bulan upah
  12–15 tahun       : 5 bulan upah
  15–18 tahun       : 6 bulan upah
  18–21 tahun       : 7 bulan upah
  21–24 tahun       : 8 bulan upah
  ≥ 24 tahun        : 10 bulan upah

UANG PENGGANTIAN HAK (UPH):
  - Cuti tahunan yang belum diambil dan belum gugur
  - Ongkos pulang karyawan dan keluarga ke tempat asal (jika relevan)
  - Biaya perumahan serta pengobatan yang ditetapkan dalam PP/PKB

MULTIPLIER BERDASARKAN ALASAN PHK:
  PHK karena efisiensi/reorganisasi:       UP × 1 + UPMK × 1 + UPH
  PHK karena perusahaan tutup (merugi):    UP × 0.5 + UPMK × 1 + UPH
  PHK karena force majeure:                UP × 0.5 + UPMK × 1 + UPH
  PHK karena karyawan sakit berkepanjangan: UP × 2 + UPMK × 2 + UPH
  PHK karena SP3 (pelanggaran berulang):   UP × 1 + UPMK × 1 + UPH
  Pengunduran diri karyawan:              TIDAK ADA pesangon, hanya UPH
  Pensiun:                                UP × 1.75 + UPMK × 1 + UPH

PENTING: Formula di atas adalah berdasarkan UU Cipta Kerja & PP turunannya.
Beberapa kasus memerlukan interpretasi — selalu konfirm dengan konsultan
untuk PHK yang nilainya besar atau ada sengketa.
```

---

```
[KOPERASI SURAT PERUSAHAAN]

SURAT PEMUTUSAN HUBUNGAN KERJA
Nomor: {{PHK_DOC_NUMBER}}

Yang bertanda tangan di bawah ini:
Nama      : {{SIGNER_NAME}}
Jabatan   : {{SIGNER_TITLE}}
Perusahaan: {{COMPANY_NAME}}

Dengan ini memberitahukan kepada:
Nama        : {{EMPLOYEE_NAME}}
Jabatan     : {{POSITION}}
Departemen  : {{DEPARTMENT}}
NIK         : {{EMPLOYEE_NIK}}
Mulai bekerja: {{JOIN_DATE}}

bahwa Perusahaan dengan berat hati harus melakukan Pemutusan Hubungan Kerja
terhitung sejak tanggal {{TERMINATION_DATE}}.

I. ALASAN PEMUTUSAN HUBUNGAN KERJA

{{PHK_REASON_DESCRIPTION}}

[Referensi pasal yang relevan sesuai alasan PHK]

II. KALKULASI HAK-HAK KARYAWAN

Masa kerja: {{YEARS_OF_SERVICE}} tahun {{MONTHS_OF_SERVICE}} bulan
Upah terakhir (dasar perhitungan): Rp{{BASE_SALARY_FOR_CALC}}

Uang Pesangon (UP):
  {{YEARS_CATEGORY}} masa kerja = {{UP_MULTIPLIER}} × Rp{{BASE_SALARY_FOR_CALC}}
  UP = Rp{{UP_AMOUNT}}
  Multiplier alasan PHK: × {{PHK_MULTIPLIER}}
  Total UP = Rp{{UP_TOTAL}}

Uang Penghargaan Masa Kerja (UPMK):
  {{YEARS_CATEGORY}} masa kerja = {{UPMK_MULTIPLIER}} × Rp{{BASE_SALARY_FOR_CALC}}
  Total UPMK = Rp{{UPMK_TOTAL}}

Uang Penggantian Hak (UPH):
  Cuti yang belum diambil: {{REMAINING_LEAVE}} hari
  Nilai per hari: Rp{{BASE_SALARY_FOR_CALC}} ÷ 25 = Rp{{DAILY_RATE}}
  Total UPH cuti: Rp{{UPH_LEAVE}}
  [Tambahkan komponen UPH lain jika ada]
  Total UPH = Rp{{UPH_TOTAL}}

TOTAL YANG DITERIMA KARYAWAN:
  UP   : Rp{{UP_TOTAL}}
  UPMK : Rp{{UPMK_TOTAL}}
  UPH  : Rp{{UPH_TOTAL}}
  ─────────────────────────────
  TOTAL: Rp{{GRAND_TOTAL}}

(Terbilang: {{GRAND_TOTAL_WORDS}})

III. MEKANISME PEMBAYARAN

Pembayaran hak-hak tersebut di atas akan dilakukan paling lambat
{{PAYMENT_DATE}} melalui transfer ke rekening:
  Bank    : {{EMPLOYEE_BANK}}
  No. Rek : {{EMPLOYEE_ACCOUNT_NUMBER}}
  Atas Nama: {{EMPLOYEE_NAME}}

IV. PENGEMBALIAN ASET PERUSAHAAN

Saudara/i diharapkan mengembalikan seluruh aset perusahaan yang dipinjamkan:
{{COMPANY_ASSETS_TO_RETURN}}
paling lambat pada tanggal {{ASSET_RETURN_DATE}}.

V. KETENTUAN KERAHASIAAN

Saudara/i tetap terikat dengan kewajiban menjaga kerahasiaan informasi
perusahaan sebagaimana diatur dalam perjanjian kerja, tanpa batas waktu.

VI. TANDA TERIMA DAN PERSETUJUAN

Dengan menandatangani surat ini, kedua belah pihak menyatakan sepakat atas
isi dan hak-hak yang tercantum dalam surat ini.

{{COMPANY_CITY}}, {{DATE}}

Perusahaan,                      Karyawan,


[Tanda tangan & stempel]         [Tanda tangan]


{{SIGNER_NAME}}                  {{EMPLOYEE_NAME}}
{{SIGNER_TITLE}}                 {{POSITION}}

Catatan: Dokumen ini dibuat sebagai bukti sah PHK. Apabila ada
ketidaksesuaian, Karyawan dapat mengajukan perselisihan sesuai
UU No. 2 Tahun 2004 tentang PPHI.
```

---

### 2.5 Offer Letter (Surat Penawaran Kerja)

**Kapan digunakan:** Sebelum kontrak resmi — konfirmasi offer ke kandidat.

---

```
[KOP SURAT PERUSAHAAN]

SURAT PENAWARAN KERJA
Nomor: {{OFFER_DOC_NUMBER}}

{{COMPANY_CITY}}, {{DATE}}

Yth.
{{CANDIDATE_NAME}}
{{CANDIDATE_ADDRESS}}

Dengan hormat,

Merujuk pada proses seleksi yang telah Saudara/i ikuti, kami dengan senang hati
menyampaikan bahwa {{COMPANY_NAME}} bermaksud menawarkan posisi kerja kepada
Saudara/i dengan rincian sebagai berikut:

POSISI DAN PENEMPATAN:
  Jabatan     : {{POSITION}}
  Departemen  : {{DEPARTMENT}}
  Atasan langsung: {{DIRECT_MANAGER}}
  Lokasi kerja: {{WORK_LOCATION}}
  Tanggal mulai: {{START_DATE}}

STATUS KEPEGAWAIAN:
  [Pilih: PKWT / PKWTT dengan masa percobaan]
  {{EMPLOYMENT_STATUS_DESCRIPTION}}

KOMPENSASI:
  Gaji Pokok          : Rp{{BASE_SALARY}} per bulan
  Tunjangan Transport : Rp{{TRANSPORT_ALLOWANCE}} per bulan
  Tunjangan Makan     : Rp{{MEAL_ALLOWANCE}} per bulan
  [Tunjangan lain sesuai kebijakan perusahaan]
  ────────────────────────────────────────
  Total Penghasilan Tetap: Rp{{TOTAL_FIXED}} per bulan

  Fasilitas tambahan:
  {{BENEFITS_LIST}}

KETENTUAN LAIN:
  Jam kerja : {{WORK_HOURS}}
  Hari kerja: {{WORK_DAYS}}
  Cuti tahunan: 12 hari kerja per tahun (setelah 12 bulan kerja)

Penawaran ini berlaku sampai dengan {{OFFER_EXPIRY_DATE}}. Apabila
Saudara/i menyetujui penawaran ini, mohon menyampaikan konfirmasi tertulis
atau menghubungi {{HRD_PIC_NAME}} di {{HRD_PIC_CONTACT}}.

Dokumen yang perlu dibawa saat hari pertama masuk:
  1. Fotokopi KTP
  2. Fotokopi Kartu Keluarga
  3. Fotokopi ijazah terakhir yang dilegalisir
  4. Fotokopi NPWP (jika sudah ada)
  5. Fotokopi buku rekening bank
  6. Pas foto 3×4 sebanyak 2 lembar
  7. Surat keterangan sehat dari dokter
  {{ADDITIONAL_DOCS}}

Kami berharap dapat segera bekerja sama dengan Saudara/i. Apabila ada
pertanyaan, jangan ragu untuk menghubungi kami.

Hormat kami,
{{COMPANY_NAME}}


[Tanda tangan & stempel]


{{HRD_SIGNER_NAME}}
{{HRD_SIGNER_TITLE}}

─────────────────────────────────────────
KONFIRMASI PENERIMAAN

Saya, {{CANDIDATE_NAME}}, dengan ini menyatakan:
[ ] Menerima penawaran kerja di atas
[ ] Menolak penawaran kerja di atas

Tanda tangan: _________________________ Tanggal: _____________
```

---

### 2.6 Surat Keterangan Kerja

**Kapan digunakan:** Untuk keperluan perbankan, KPR, visa, dll.

---

```
[KOP SURAT PERUSAHAAN]

SURAT KETERANGAN KERJA
Nomor: {{SKK_NUMBER}}

Yang bertanda tangan di bawah ini:
Nama    : {{HRD_SIGNER_NAME}}
Jabatan : {{HRD_SIGNER_TITLE}}
Perusahaan: {{COMPANY_NAME}}

Menerangkan dengan sesungguhnya bahwa:
Nama            : {{EMPLOYEE_NAME}}
NIK/KTP         : {{EMPLOYEE_NIK}}
Tempat/Tgl Lahir: {{EMPLOYEE_BIRTHPLACE}}, {{EMPLOYEE_BIRTHDATE}}
Jabatan         : {{POSITION}}
Departemen      : {{DEPARTMENT}}
Mulai bekerja   : {{JOIN_DATE}}
Status          : Karyawan {{EMPLOYMENT_TYPE}} (Aktif)
Gaji            : Rp{{SALARY}} per bulan
                  [Hanya cantumkan gaji jika diminta dan ada izin karyawan]

adalah benar-benar karyawan {{COMPANY_NAME}} yang masih aktif bekerja.

Surat keterangan ini dibuat untuk keperluan:
{{PURPOSE}}
dan tidak dipergunakan untuk keperluan lain.

Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat digunakan
sebagaimana mestinya.

{{COMPANY_CITY}}, {{DATE}}


[Tanda tangan & stempel]


{{HRD_SIGNER_NAME}}
{{HRD_SIGNER_TITLE}}
```

---

### 2.7 Surat Mutasi / Rotasi

**Kapan digunakan:** Perpindahan jabatan, departemen, atau lokasi kerja.

---

```
[KOP SURAT PERUSAHAAN]

SURAT KEPUTUSAN MUTASI KARYAWAN
Nomor: {{MUTASI_DOC_NUMBER}}

Menimbang   : a. bahwa dalam rangka {{MUTASI_REASON}},
                 diperlukan penyesuaian penempatan karyawan;
              b. bahwa {{EMPLOYEE_NAME}} dinilai memiliki kompetensi
                 yang sesuai untuk posisi baru yang dituju;

Mengingat   : Peraturan Perusahaan {{COMPANY_NAME}} dan
              ketentuan perundangan ketenagakerjaan yang berlaku.

MEMUTUSKAN:

Menetapkan mutasi karyawan dengan ketentuan sebagai berikut:

Nama Karyawan   : {{EMPLOYEE_NAME}}
NIK             : {{EMPLOYEE_NIK}}

JABATAN/POSISI SEBELUMNYA:
  Jabatan     : {{OLD_POSITION}}
  Departemen  : {{OLD_DEPARTMENT}}
  Lokasi kerja: {{OLD_LOCATION}}

JABATAN/POSISI BARU:
  Jabatan     : {{NEW_POSITION}}
  Departemen  : {{NEW_DEPARTMENT}}
  Lokasi kerja: {{NEW_LOCATION}}
  Atasan baru : {{NEW_MANAGER}}

EFEKTIF BERLAKU: {{EFFECTIVE_DATE}}

KETENTUAN KOMPENSASI:
  [Pilih yang relevan:]
  a. Tidak ada perubahan gaji dan tunjangan
  b. Penyesuaian gaji menjadi Rp{{NEW_SALARY}} per bulan,
     berlaku mulai {{SALARY_EFFECTIVE_DATE}}

KEWAJIBAN HANDOVER:
  {{EMPLOYEE_NAME}} wajib menyelesaikan serah terima pekerjaan kepada
  {{HANDOVER_TO}} paling lambat {{HANDOVER_DATE}}.

Keputusan ini bersifat mengikat dan wajib dilaksanakan. Apabila ada
keberatan, dapat disampaikan melalui mekanisme yang diatur dalam
peraturan perusahaan.

{{COMPANY_CITY}}, {{DATE}}

Ditetapkan oleh,
{{COMPANY_NAME}}


[Tanda tangan & stempel]


{{SIGNER_NAME}}
{{SIGNER_TITLE}}

Mengetahui:
HRD Manager,                    Karyawan yang bersangkutan,


{{HRD_MANAGER_NAME}}            {{EMPLOYEE_NAME}}
```

---

## BAGIAN 3: INSTRUKSI KALKULASI OTOMATIS

### 3.1 Kalkulasi Pesangon — Cara Agent Menghitung

```
INPUT YANG DIBUTUHKAN:
  - join_date: tanggal mulai kerja
  - termination_date: tanggal efektif PHK
  - base_salary: gaji pokok (BUKAN total penghasilan)
  - phk_reason: alasan PHK
  - remaining_leave: sisa cuti yang belum diambil

STEP 1: Hitung masa kerja
  years = floor((termination_date - join_date) / 365)
  months = remaining months setelah dibulatkan ke tahun

STEP 2: Tentukan UP multiplier dari tabel
  (lihat tabel di Bagian 2.4)

STEP 3: Tentukan UPMK multiplier dari tabel
  (hanya jika masa kerja ≥ 3 tahun)

STEP 4: Tentukan PHK multiplier dari alasan
  (lihat tabel di Bagian 2.4)

STEP 5: Hitung UPH
  daily_rate = base_salary / 25
  uph_leave = remaining_leave × daily_rate
  (tambah komponen UPH lain jika ada)

STEP 6: Total
  total = (UP × PHK_multiplier) + UPMK + UPH

STEP 7: Terbilang
  Konversi angka ke teks Bahasa Indonesia
  (contoh: Rp25.000.000 → "Dua Puluh Lima Juta Rupiah")

CONTOH KALKULASI:
  Karyawan: Budi Santoso
  Join: 1 Januari 2018
  PHK: 15 Maret 2026 (alasan: efisiensi)
  Masa kerja: 8 tahun 2 bulan
  Gaji pokok: Rp8.000.000
  Sisa cuti: 7 hari

  UP: masa kerja ≥ 8 tahun = 9 bulan upah
      9 × Rp8.000.000 = Rp72.000.000
      PHK efisiensi multiplier = ×1
      UP total = Rp72.000.000

  UPMK: 6-9 tahun = 3 bulan upah
        3 × Rp8.000.000 = Rp24.000.000

  UPH: 7 hari × (Rp8.000.000/25) = 7 × Rp320.000 = Rp2.240.000

  TOTAL = Rp72.000.000 + Rp24.000.000 + Rp2.240.000 = Rp98.240.000
```

---

## BAGIAN 4: QUALITY CHECKS SEBELUM DELIVER

```
SEBELUM KIRIM DOKUMEN, VERIFY:

PKWT/PKWTT:
  [ ] Tanggal konsisten di seluruh dokumen
  [ ] Gaji tidak di bawah UMP provinsi yang berlaku
  [ ] Ada klausul BPJS
  [ ] PKWT: ada pasal uang kompensasi
  [ ] PKWTT: ada klausul probation (jika ada masa percobaan)
  [ ] Nomor dokumen terisi
  [ ] Ruang tanda tangan lengkap (kedua pihak + saksi)

SURAT PERINGATAN:
  [ ] Nomor SP (1/2/3) konsisten di judul dan isi
  [ ] Untuk SP2/SP3: ada referensi SP sebelumnya
  [ ] Deskripsi pelanggaran spesifik (tanggal, jenis, uraian)
  [ ] Masa berlaku 6 bulan disebutkan
  [ ] Konsekuensi sesuai nomor SP

SURAT PHK:
  [ ] Kalkulasi pesangon terisi lengkap dan benar
  [ ] Alasan PHK sesuai dengan multiplier yang digunakan
  [ ] Tanggal pembayaran terisi
  [ ] Ada klausul pengembalian aset (jika relevan)
  [ ] Terbilang angka pesangon terisi

UMUM:
  [ ] Tidak ada variabel {{...}} yang belum terisi
  [ ] Tanggal dokumen benar
  [ ] KOP surat ada (placeholder untuk logo)
  [ ] Footer disclaimer AI ada
```

---

## BAGIAN 5: EDGE CASES & SITUASI KHUSUS

```
KASUS 1: PHK karyawan masa percobaan (probation)
  → Probation bisa diakhiri kapan saja tanpa pesangon
  → Tapi upah minimum tetap harus dibayar selama masa probation
  → Surat PHK probation lebih sederhana, tidak ada kalkulasi pesangon

KASUS 2: Karyawan PKWT yang mau diangkat jadi PKWTT
  → Buat PKWTT baru dengan masa kerja yang dihitung sejak PKWT pertama
  → Masa kerja PKWT dihitung untuk hak cuti dan (nanti) pesangon
  → Tidak perlu SP atau PHK — cukup PKWTT baru

KASUS 3: SP untuk absensi
  → Aturan umum: 5 hari berturut-turut tanpa keterangan = bisa langsung SP
  → Tapi setiap perusahaan bisa punya threshold berbeda di Peraturan Perusahaan
  → Cek PP/PKB perusahaan sebelum draft SP

KASUS 4: Karyawan menolak tanda tangan SP
  → Sertakan klausul di SP: "Apabila Karyawan menolak menandatangani..."
  → Penolakan tanda tangan tidak membatalkan SP
  → Harus ada saksi 2 orang yang menandatangani sebagai witness

KASUS 5: PHK massal (≥10 karyawan)
  → Eskalasi ke konsultan hukum — agent tidak generate dokumen ini tanpa review
  → Ada prosedur khusus: wajib lapor ke Disnaker, LKKS, dll sebelum eksekusi

KASUS 6: Karyawan asing (expatriate)
  → Ada aturan tambahan: KITAS, IMTA (izin mempekerjakan TKA)
  → Eskalasi ke konsultan hukum untuk dokumen yang melibatkan WNA
```

---

## CATATAN IMPLEMENTASI

```
TOOL YANG DIGUNAKAN:
  generate_docx: untuk dokumen yang perlu di-edit lebih lanjut oleh HRD
  generate_pdf:  untuk dokumen final siap tanda tangan

FORMAT DEFAULT: PDF, kecuali HRD minta DOCX untuk diedit

NAMING CONVENTION FILE:
  [JENIS_DOK]_[NAMA_KARYAWAN]_[TANGGAL].pdf
  Contoh: PKWT_Budi_Santoso_20260319.pdf
          SP1_Rini_Wulandari_20260319.pdf
          PHK_Ahmad_Fauzi_20260319.pdf

SUPABASE QUERIES YANG DIBUTUHKAN:
  - Data karyawan: employees table (nama, NIK, join_date, salary, position, dept)
  - Riwayat SP: employee_warnings table (untuk cek SP sebelumnya)
  - Sisa cuti: employee_leaves table (untuk kalkulasi UPH)
```

---

*DRAFT v1. Fine-tune: tambah template dokumen lain (surat promosi,
surat rotasi internal, berita acara serah terima jabatan, NDA),
regional variations untuk perusahaan multi-lokasi.*

