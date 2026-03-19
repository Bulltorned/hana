export const CSV_HEADERS = [
  "name",
  "employee_id",
  "jabatan",
  "divisi",
  "status_kontrak",
  "tgl_mulai",
  "tgl_berakhir",
  "no_bpjs_kes",
  "no_bpjs_tk",
  "npwp",
  "gaji_pokok",
  "email",
  "phone",
] as const;

export const CSV_TEMPLATE = `name,employee_id,jabatan,divisi,status_kontrak,tgl_mulai,tgl_berakhir,no_bpjs_kes,no_bpjs_tk,npwp,gaji_pokok,email,phone
Budi Santoso,EMP001,Staff Operasional,Operasional,PKWT,2024-01-15,2025-01-14,0001234567890,0001234567890,12.345.678.9-012.000,5000000,budi@email.com,081234567890
Siti Rahayu,EMP002,Manager HRD,HRD,PKWTT,2023-06-01,,,,,8000000,siti@email.com,081234567891`;

export function downloadCSVTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "template_karyawan.csv";
  link.click();
  URL.revokeObjectURL(url);
}
