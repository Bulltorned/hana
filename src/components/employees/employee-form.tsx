"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/shared/filter-select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Employee, ContractStatus } from "@/lib/types";

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

  // Controlled form state
  const [name, setName] = useState(employee?.name ?? "");
  const [employeeId, setEmployeeId] = useState(employee?.employee_id ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [jabatan, setJabatan] = useState(employee?.jabatan ?? "");
  const [divisi, setDivisi] = useState(employee?.divisi ?? "");
  const [gajiPokok, setGajiPokok] = useState(String(employee?.gaji_pokok ?? 0));
  const [statusKontrak, setStatusKontrak] = useState<ContractStatus>(
    employee?.status_kontrak ?? "PKWT"
  );
  const [tglMulai, setTglMulai] = useState(
    employee?.tgl_mulai ?? new Date().toISOString().split("T")[0]
  );
  const [tglBerakhir, setTglBerakhir] = useState(employee?.tgl_berakhir ?? "");
  const [noBpjsKes, setNoBpjsKes] = useState(employee?.no_bpjs_kes ?? "");
  const [noBpjsTk, setNoBpjsTk] = useState(employee?.no_bpjs_tk ?? "");
  const [npwp, setNpwp] = useState(employee?.npwp ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nama wajib diisi";
    if (!jabatan.trim()) errs.jabatan = "Jabatan wajib diisi";
    if (!divisi.trim()) errs.divisi = "Divisi wajib diisi";
    if (!tglMulai) errs.tgl_mulai = "Tanggal mulai wajib diisi";
    if (statusKontrak !== "PKWTT" && !tglBerakhir) {
      errs.tgl_berakhir = "Tanggal berakhir wajib untuk PKWT/Probation";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Email tidak valid";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const data = {
      tenant_id: tenantId,
      name: name.trim(),
      employee_id: employeeId || null,
      jabatan: jabatan.trim(),
      divisi: divisi.trim(),
      status_kontrak: statusKontrak,
      tgl_mulai: tglMulai,
      tgl_berakhir: statusKontrak === "PKWTT" ? null : tglBerakhir || null,
      no_bpjs_kes: noBpjsKes,
      no_bpjs_tk: noBpjsTk,
      npwp,
      gaji_pokok: Number(gajiPokok) || 0,
      email: email || null,
      phone: phone || null,
    };

    try {
      const url = isEditing ? `/api/employees/${employee!.id}` : "/api/employees";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(
          isEditing ? "Data karyawan berhasil diperbarui" : "Karyawan berhasil ditambahkan"
        );
        onSuccess?.();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan data karyawan");
      }
    } catch {
      toast.error("Gagal menyimpan data karyawan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data Pribadi */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Data Pribadi</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="emp-name">Nama Lengkap *</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-urgent">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-id">ID Karyawan</Label>
              <Input
                id="emp-id"
                placeholder="EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-xs text-urgent">{errors.email}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-phone">No. Telepon</Label>
            <Input
              id="emp-phone"
              placeholder="081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Jabatan */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Jabatan</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="emp-jabatan">Jabatan *</Label>
            <Input
              id="emp-jabatan"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
            />
            {errors.jabatan && (
              <p className="text-xs text-urgent">{errors.jabatan}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-divisi">Divisi *</Label>
            <Input
              id="emp-divisi"
              value={divisi}
              onChange={(e) => setDivisi(e.target.value)}
            />
            {errors.divisi && (
              <p className="text-xs text-urgent">{errors.divisi}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5 mt-3">
          <Label htmlFor="emp-gaji">Gaji Pokok (Rp)</Label>
          <Input
            id="emp-gaji"
            type="number"
            value={gajiPokok}
            onChange={(e) => setGajiPokok(e.target.value)}
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
              onChange={(v) => setStatusKontrak(v as ContractStatus)}
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
              <Label htmlFor="emp-tgl-mulai">Tanggal Mulai *</Label>
              <Input
                id="emp-tgl-mulai"
                type="date"
                value={tglMulai}
                onChange={(e) => setTglMulai(e.target.value)}
              />
              {errors.tgl_mulai && (
                <p className="text-xs text-urgent">{errors.tgl_mulai}</p>
              )}
            </div>
            {statusKontrak !== "PKWTT" && (
              <div className="space-y-1.5">
                <Label htmlFor="emp-tgl-berakhir">Tanggal Berakhir *</Label>
                <Input
                  id="emp-tgl-berakhir"
                  type="date"
                  value={tglBerakhir}
                  onChange={(e) => setTglBerakhir(e.target.value)}
                />
                {errors.tgl_berakhir && (
                  <p className="text-xs text-urgent">{errors.tgl_berakhir}</p>
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
              <Label htmlFor="emp-bpjs-kes">No. BPJS Kesehatan</Label>
              <Input
                id="emp-bpjs-kes"
                value={noBpjsKes}
                onChange={(e) => setNoBpjsKes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-bpjs-tk">No. BPJS Ketenagakerjaan</Label>
              <Input
                id="emp-bpjs-tk"
                value={noBpjsTk}
                onChange={(e) => setNoBpjsTk(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-npwp">NPWP</Label>
            <Input
              id="emp-npwp"
              value={npwp}
              onChange={(e) => setNpwp(e.target.value)}
            />
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
          disabled={submitting}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Menyimpan...
            </>
          ) : isEditing ? (
            "Simpan Perubahan"
          ) : (
            "Tambah Karyawan"
          )}
        </Button>
      </div>
    </form>
  );
}
