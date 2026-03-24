"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeInput } from "@/lib/validations/employee";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/shared/filter-select";
import { Separator } from "@/components/ui/separator";
import type { Employee } from "@/lib/types";

interface EmployeeFormProps {
  employee?: Employee | null;
  tenantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmployeeForm({
  employee,
  tenantId,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name,
          employee_id: employee.employee_id,
          jabatan: employee.jabatan,
          divisi: employee.divisi,
          status_kontrak: employee.status_kontrak,
          tgl_mulai: employee.tgl_mulai,
          tgl_berakhir: employee.tgl_berakhir,
          no_bpjs_kes: employee.no_bpjs_kes,
          no_bpjs_tk: employee.no_bpjs_tk,
          npwp: employee.npwp,
          gaji_pokok: employee.gaji_pokok,
          email: employee.email,
          phone: employee.phone,
        }
      : {
          name: "",
          jabatan: "",
          divisi: "",
          status_kontrak: "PKWT",
          tgl_mulai: new Date().toISOString().split("T")[0],
          no_bpjs_kes: "",
          no_bpjs_tk: "",
          npwp: "",
          gaji_pokok: 0,
        },
  });

  const statusKontrak = watch("status_kontrak");

  async function onSubmit(data: EmployeeInput) {
    const url = isEditing
      ? `/api/employees/${employee!.id}`
      : "/api/employees";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tenant_id: tenantId }),
    });

    if (res.ok) {
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Data Pribadi */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Data Pribadi</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-urgent">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="employee_id">ID Karyawan</Label>
              <Input
                id="employee_id"
                placeholder="EMP001"
                {...register("employee_id")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-urgent">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input id="phone" placeholder="081234567890" {...register("phone")} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Jabatan */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Jabatan</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="jabatan">Jabatan *</Label>
            <Input id="jabatan" {...register("jabatan")} />
            {errors.jabatan && (
              <p className="text-xs text-urgent">{errors.jabatan.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="divisi">Divisi *</Label>
            <Input id="divisi" {...register("divisi")} />
            {errors.divisi && (
              <p className="text-xs text-urgent">{errors.divisi.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5 mt-3">
          <Label htmlFor="gaji_pokok">Gaji Pokok (Rp)</Label>
          <Input
            id="gaji_pokok"
            type="number"
            {...register("gaji_pokok")}
          />
        </div>
      </div>

      <Separator />

      {/* Kontrak */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Kontrak</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Status Kontrak *</Label>
            <FilterSelect
              value={statusKontrak}
              onChange={(v) =>
                setValue("status_kontrak", v as EmployeeInput["status_kontrak"])
              }
              placeholder="Pilih status kontrak"
              width="w-full"
              options={[
                { value: "PKWTT", label: "PKWTT (Tetap)" },
                { value: "PKWT", label: "PKWT (Kontrak)" },
                { value: "Probation", label: "Probation" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tgl_mulai">Tanggal Mulai *</Label>
              <Input id="tgl_mulai" type="date" {...register("tgl_mulai")} />
              {errors.tgl_mulai && (
                <p className="text-xs text-urgent">
                  {errors.tgl_mulai.message}
                </p>
              )}
            </div>
            {statusKontrak !== "PKWTT" && (
              <div className="space-y-1.5">
                <Label htmlFor="tgl_berakhir">Tanggal Berakhir *</Label>
                <Input
                  id="tgl_berakhir"
                  type="date"
                  {...register("tgl_berakhir")}
                />
                {errors.tgl_berakhir && (
                  <p className="text-xs text-urgent">
                    {errors.tgl_berakhir.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* BPJS & NPWP */}
      <div>
        <h3 className="text-sm font-semibold mb-3">BPJS & NPWP</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="no_bpjs_kes">No. BPJS Kesehatan</Label>
              <Input id="no_bpjs_kes" {...register("no_bpjs_kes")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="no_bpjs_tk">No. BPJS Ketenagakerjaan</Label>
              <Input id="no_bpjs_tk" {...register("no_bpjs_tk")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="npwp">NPWP</Label>
            <Input id="npwp" {...register("npwp")} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
        >
          {isSubmitting
            ? "Menyimpan..."
            : isEditing
              ? "Simpan Perubahan"
              : "Tambah Karyawan"}
        </Button>
      </div>
    </form>
  );
}
