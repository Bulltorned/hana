"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSelect } from "@/components/shared/filter-select";
import type { Tenant, TenantSettings } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Users,
  Save,
  Loader2,
} from "lucide-react";

interface TenantWithSettings extends Tenant {
  tenant_settings: TenantSettings | null;
}

const planLabels: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

const statusStyles: Record<string, string> = {
  active: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  provisioning: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  suspended: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantWithSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("trial");
  const [status, setStatus] = useState("provisioning");
  const [kopNama, setKopNama] = useState("");
  const [kopAlamat, setKopAlamat] = useState("");
  const [kopTelepon, setKopTelepon] = useState("");
  const [kopEmail, setKopEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerJabatan, setSignerJabatan] = useState("");

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) {
        router.push("/tenants");
        return;
      }
      const data: TenantWithSettings = await res.json();
      setTenant(data);

      // Populate form
      setName(data.name);
      setPlan(data.plan);
      setStatus(data.status);
      if (data.tenant_settings) {
        setKopNama(data.tenant_settings.kop_surat?.nama ?? "");
        setKopAlamat(data.tenant_settings.kop_surat?.alamat ?? "");
        setKopTelepon(data.tenant_settings.kop_surat?.telepon ?? "");
        setKopEmail(data.tenant_settings.kop_surat?.email ?? "");
        setSignerName(data.tenant_settings.signer_name ?? "");
        setSignerJabatan(data.tenant_settings.signer_jabatan ?? "");
      }

      // Fetch employee count
      const empRes = await fetch(`/api/employees?tenant_id=${tenantId}`);
      if (empRes.ok) {
        const employees = await empRes.json();
        setEmployeeCount(employees.length);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, router]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  async function handleSave() {
    setSaving(true);
    try {
      // Update tenant
      const tenantRes = await fetch(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, plan, status }),
      });

      if (!tenantRes.ok) {
        toast.error("Gagal menyimpan data tenant");
        return;
      }

      toast.success("Data tenant berhasil disimpan");
      fetchTenant();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-tertiary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-24 text-tertiary">
        <p>Tenant tidak ditemukan.</p>
        <Link href="/tenants" className="text-brand-indigo hover:underline text-sm mt-2 inline-block">
          Kembali ke daftar tenant
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/tenants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight">
                {tenant.name}
              </h2>
              <Badge
                variant="outline"
                className={statusStyles[tenant.status] ?? ""}
              >
                {tenant.status}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {planLabels[tenant.plan]}
              </Badge>
            </div>
            <p className="text-xs text-tertiary mt-0.5">
              Dibuat {new Date(tenant.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Simpan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-indigo" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{employeeCount}</div>
            <div className="text-[10px] text-tertiary">Total Karyawan</div>
          </div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand-teal" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono capitalize">{tenant.plan}</div>
            <div className="text-[10px] text-tertiary">Paket Aktif</div>
          </div>
        </div>
        <Link
          href={`/employees`}
          className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:shadow-glass-hover transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-violet" />
          </div>
          <div>
            <div className="text-sm font-semibold">Kelola Karyawan →</div>
            <div className="text-[10px] text-tertiary">Buka halaman karyawan</div>
          </div>
        </Link>
      </div>

      {/* Detail Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Basic Info */}
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <h3 className="text-[14px] font-semibold tracking-tight mb-4">
            Informasi Dasar
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Perusahaan</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Paket</Label>
              <FilterSelect
                value={plan}
                onChange={setPlan}
                placeholder="Pilih paket"
                width="w-full"
                options={[
                  { value: "trial", label: "Trial" },
                  { value: "starter", label: "Starter" },
                  { value: "growth", label: "Growth" },
                  { value: "pro", label: "Pro" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <FilterSelect
                value={status}
                onChange={setStatus}
                placeholder="Pilih status"
                width="w-full"
                options={[
                  { value: "provisioning", label: "Provisioning" },
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Kop Surat */}
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <h3 className="text-[14px] font-semibold tracking-tight mb-4">
            Kop Surat & Penandatangan
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Perusahaan (Kop)</Label>
              <Input
                value={kopNama}
                onChange={(e) => setKopNama(e.target.value)}
                placeholder="PT Contoh Indonesia"
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                value={kopAlamat}
                onChange={(e) => setKopAlamat(e.target.value)}
                placeholder="Jl. Contoh No. 123, Jakarta"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input
                  value={kopTelepon}
                  onChange={(e) => setKopTelepon(e.target.value)}
                  placeholder="021-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={kopEmail}
                  onChange={(e) => setKopEmail(e.target.value)}
                  placeholder="hr@perusahaan.com"
                />
              </div>
            </div>
            <div className="border-t border-brand-indigo/[0.08] pt-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nama Penandatangan</Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan</Label>
                  <Input
                    value={signerJabatan}
                    onChange={(e) => setSignerJabatan(e.target.value)}
                    placeholder="HRD Manager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
