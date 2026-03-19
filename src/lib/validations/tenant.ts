import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  plan: z.enum(["trial", "starter", "growth", "pro"]),
  status: z.enum(["provisioning", "active", "suspended"]),
});

export const updateTenantSchema = createTenantSchema.partial();

export const tenantSettingsSchema = z.object({
  logo_url: z.string().nullable().optional(),
  brand_color: z.string().default("#4F7BF7"),
  kop_surat: z.object({
    nama: z.string(),
    alamat: z.string(),
    telepon: z.string(),
    email: z.string().email().or(z.literal("")),
  }),
  signer_name: z.string(),
  signer_jabatan: z.string(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantSettingsInput = z.infer<typeof tenantSettingsSchema>;
