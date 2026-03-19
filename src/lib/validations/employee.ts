import { z } from "zod";

export const employeeSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    employee_id: z.string().optional().nullable(),
    jabatan: z.string().min(1, "Jabatan wajib diisi"),
    divisi: z.string().min(1, "Divisi wajib diisi"),
    status_kontrak: z.enum(["PKWTT", "PKWT", "Probation"]),
    tgl_mulai: z.string().min(1, "Tanggal mulai wajib diisi"),
    tgl_berakhir: z.string().optional().nullable(),
    no_bpjs_kes: z.string(),
    no_bpjs_tk: z.string(),
    npwp: z.string(),
    gaji_pokok: z.coerce.number().min(0),
    email: z.string().email("Email tidak valid").optional().nullable(),
    phone: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status_kontrak !== "PKWTT" && !data.tgl_berakhir) {
        return false;
      }
      return true;
    },
    {
      message: "Tanggal berakhir wajib diisi untuk kontrak PKWT/Probation",
      path: ["tgl_berakhir"],
    }
  );

export const employeeUpdateSchema = employeeSchema;

export type EmployeeInput = z.infer<typeof employeeSchema>;
