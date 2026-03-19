---
name: Tenant Context
version: 1.0.0
description: >
  File konteks per client yang di-customize saat onboarding. Berisi informasi
  spesifik perusahaan yang agent butuhkan untuk memberikan respons yang
  personalized dan akurat. Di-generate sekali saat setup, di-update jika ada
  perubahan signifikan (misal: pindah provinsi, perubahan jumlah karyawan).
triggers:
  - "__always_load__"
priority: 1
author: EPIK Parallax / HRD Agent OS
last_updated: 2026-03
note: >
  File ini adalah TEMPLATE. Setiap tenant punya versi sendiri yang sudah
  diisi dengan data mereka. Jangan gunakan file template ini langsung.
---

# TENANT CONTEXT: {{COMPANY_NAME}}

## INFORMASI PERUSAHAAN

```
Nama perusahaan:    {{COMPANY_NAME}}
Nama pendek:        {{COMPANY_SHORT_NAME}}
Jenis badan usaha:  {{LEGAL_ENTITY}}  (PT / CV / Yayasan / dll)
Industri:           {{INDUSTRY}}
Sub-sektor:         {{INDUSTRY_SUB}}

Lokasi HQ:          {{HQ_CITY}}, {{HQ_PROVINCE}}
Provinsi operasi:   {{OPERATING_PROVINCES}}
  (tulis semua provinsi jika karyawan tersebar — penting untuk UMP yang berlaku)
```

## DATA KARYAWAN

```
Total karyawan aktif:  {{TOTAL_EMPLOYEES}}
  PKWTT (tetap):       {{PKWTT_COUNT}}
  PKWT (kontrak):      {{PKWT_COUNT}}
  Harian/freelance:    {{DAILY_COUNT}}

Rentang gaji:
  Terendah:  Rp{{MIN_SALARY}} (jabatan: {{MIN_SALARY_ROLE}})
  Tertinggi: Rp{{MAX_SALARY}} (jabatan: {{MAX_SALARY_ROLE}})

Distribusi agama (untuk THR planning):
  Islam:    {{MUSLIM_PCT}}%
  Kristen:  {{CHRISTIAN_PCT}}%
  Hindu:    {{HINDU_PCT}}%
  Buddha:   {{BUDDHIST_PCT}}%
  Lainnya:  {{OTHER_RELIGION_PCT}}%

Distribusi gender:
  Laki-laki:   {{MALE_PCT}}%
  Perempuan:   {{FEMALE_PCT}}%
```

## COMPLIANCE CONTEXT

```
UMP/UMK yang berlaku:
  Provinsi utama ({{HQ_PROVINCE}}): Rp{{UMP_MAIN}}
  Provinsi lain (jika ada): {{UMP_OTHER_PROVINCES}}

Kategori risiko JKK:
  {{JKK_RISK_CATEGORY}} — {{JKK_RATE}}%
  (berdasarkan industri: {{INDUSTRY}})

NPWP perusahaan: {{COMPANY_NPWP}}
BPJS Kesehatan nomor:     {{BPJS_KESEHATAN_ID}}
BPJS Ketenagakerjaan ID:  {{BPJS_TK_ID}}

Status compliance saat ini:
  BPJS Kesehatan:        {{BPJS_KES_STATUS}}
  BPJS Ketenagakerjaan:  {{BPJS_TK_STATUS}}
  PPh 21 terakhir:       {{PPH21_LAST_PERIOD}}
```

## KONFIGURASI AGENT

```
Nama agent untuk perusahaan ini: {{AGENT_NAME}}
  (default "Hana" jika tidak diisi)

Channel aktif:
  HRD channel:      {{HRD_CHANNEL_TYPE}} — {{HRD_CHANNEL_ID}}
  Employee channel: {{EMP_CHANNEL_TYPE}} — {{EMP_CHANNEL_ID}}

Fitur yang aktif (sesuai plan):
  360 Assessment:    {{FEATURE_360}}       (true/false)
  Compliance alerts: {{FEATURE_COMPLIANCE}} (true/false)
  Document drafter:  {{FEATURE_DOCS}}      (true/false)
  HR Helpdesk:       {{FEATURE_HELPDESK}}  (true/false)
  HR Analytics:      {{FEATURE_ANALYTICS}} (true/false)
```

## TIM HRD

```
PIC HRD utama:
  Nama:   {{HRD_PIC_NAME}}
  Jabatan: {{HRD_PIC_TITLE}}
  WA:     {{HRD_PIC_WA}}

Eskalasi backup (jika HRD PIC tidak tersedia):
  Nama:   {{HRD_BACKUP_NAME}}
  WA:     {{HRD_BACKUP_WA}}

Konsultan eksternal (jika ada):
  Konsultan hukum:  {{LEGAL_CONSULTANT}}
  Konsultan pajak:  {{TAX_CONSULTANT}}
```

## STRUKTUR ORGANISASI (RINGKAS)

```
{{ORG_STRUCTURE}}
Contoh format:
  Direktur → Manager (Ops, Finance, HR, Sales) → Staff

Jumlah divisi/departemen: {{DEPT_COUNT}}
Daftar departemen: {{DEPT_LIST}}
```

## NOTES KHUSUS

```
{{CUSTOM_NOTES}}

Isi dengan hal-hal spesifik yang agent perlu tahu tentang perusahaan ini:
  - Kebijakan internal yang tidak standar
  - Tunjangan khusus yang ada di perusahaan
  - Konteks industri yang perlu diperhatikan
  - Hal yang perlu diperhatikan saat komunikasi (misal: ada karyawan expatriate)
  - Tantangan compliance yang sudah diketahui
```

## RIWAYAT ONBOARDING

```
Tanggal mulai berlangganan: {{SUBSCRIPTION_START}}
Plan:                       {{SUBSCRIPTION_PLAN}}
Versi SKILL.md ini:         {{CONTEXT_VERSION}}
Terakhir diupdate oleh:     {{LAST_UPDATED_BY}}
Tanggal update:             {{LAST_UPDATED_DATE}}
```

---

## CARA MENGGUNAKAN FILE INI

File ini adalah template yang perlu diisi saat onboarding client baru.

### Proses onboarding (untuk operator):

1. Copy file ini ke `/skills/tenant-context/SKILL.md` di instance client
2. Isi semua variabel `{{...}}` dengan data aktual client
3. Hapus bagian "Cara Menggunakan File Ini" setelah diisi
4. Test dengan pertanyaan: "Berapa UMP yang berlaku di perusahaan ini?"
   Agent harus jawab dengan angka spesifik, bukan generic

### Variabel yang WAJIB diisi minimal:

```
COMPANY_NAME, HQ_PROVINCE, TOTAL_EMPLOYEES,
UMP_MAIN, JKK_RISK_CATEGORY, JKK_RATE,
AGENT_NAME, HRD_PIC_NAME, HRD_PIC_WA,
FEATURE_360, FEATURE_COMPLIANCE, FEATURE_DOCS, FEATURE_HELPDESK
```

### Variabel yang bisa diisi bertahap:

```
BPJS IDs, NPWP, distribusi agama/gender, konsultan eksternal
(bisa diupdate setelah onboarding awal)
```

---

*Template v1. Tambahkan variabel baru sesuai kebutuhan saat ada client
dengan kebutuhan spesifik yang belum tertampung di template ini.*
