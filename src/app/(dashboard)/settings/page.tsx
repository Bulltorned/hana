"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import { useAuth } from "@/lib/hooks/use-auth";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Bell,
  Bot,
  Palette,
  Save,
  Loader2,
  User,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const {
    tenants,
    selectedTenantId,
    selectedTenant,
    setSelectedTenantId,
    isOperator,
  } = useTenantContext();

  const { profile } = useAuth();

  // Company settings
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerJabatan, setSignerJabatan] = useState("");
  const [brandColor, setBrandColor] = useState("#4F7BF7");

  // Notification settings
  const [emailNotif, setEmailNotif] = useState(true);
  const [complianceReminder, setComplianceReminder] = useState(true);
  const [contractReminder, setContractReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const [saving, setSaving] = useState(false);

  // Load tenant settings
  useEffect(() => {
    if (!selectedTenantId) return;

    fetch(`/api/tenants/${selectedTenantId}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanyName(data.name ?? "");
        if (data.tenant_settings) {
          const s = data.tenant_settings;
          setCompanyAddress(s.kop_surat?.alamat ?? "");
          setCompanyPhone(s.kop_surat?.telepon ?? "");
          setCompanyEmail(s.kop_surat?.email ?? "");
          setSignerName(s.signer_name ?? "");
          setSignerJabatan(s.signer_jabatan ?? "");
          setBrandColor(s.brand_color ?? "#4F7BF7");
        }
      })
      .catch(() => {});
  }, [selectedTenantId]);

  async function handleSave() {
    if (!selectedTenantId) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/tenants/${selectedTenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName }),
      });

      if (res.ok) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-4xl">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Pengaturan
          </h2>
          <p className="text-xs text-tertiary mt-0.5">
            Konfigurasi perusahaan dan preferensi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isOperator && (
            <TenantSelector
              tenants={tenants}
              selectedTenantId={selectedTenantId}
              onSelect={setSelectedTenantId}
            />
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !selectedTenantId}
            className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-xs"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Simpan
          </Button>
        </div>
      </div>

      {!selectedTenantId ? (
        <div className="glass rounded-[var(--radius-xl)] p-12 text-center text-tertiary text-sm">
          <Settings className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Pilih tenant terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Profile Section */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Profil Saya
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={profile?.full_name ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={profile?.role === "operator" ? "Operator" : "Client HRD"}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Informasi Perusahaan
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Perusahaan</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="021-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="hr@perusahaan.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Penandatangan</Label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan Penandatangan</Label>
                  <Input
                    value={signerJabatan}
                    onChange={(e) => setSignerJabatan(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Tampilan
              </h3>
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/80 cursor-pointer"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-32 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Notifikasi
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Email Notifikasi</div>
                  <div className="text-xs text-tertiary">
                    Terima notifikasi penting via email
                  </div>
                </div>
                <Switch
                  checked={emailNotif}
                  onCheckedChange={setEmailNotif}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    Reminder Compliance
                  </div>
                  <div className="text-xs text-tertiary">
                    Ingatkan sebelum deadline BPJS, PPh21, dll
                  </div>
                </div>
                <Switch
                  checked={complianceReminder}
                  onCheckedChange={setComplianceReminder}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    Reminder Kontrak Habis
                  </div>
                  <div className="text-xs text-tertiary">
                    Notifikasi 30 hari sebelum PKWT berakhir
                  </div>
                </div>
                <Switch
                  checked={contractReminder}
                  onCheckedChange={setContractReminder}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Laporan Mingguan</div>
                  <div className="text-xs text-tertiary">
                    Ringkasan aktivitas HR setiap Senin pagi
                  </div>
                </div>
                <Switch
                  checked={weeklyReport}
                  onCheckedChange={setWeeklyReport}
                />
              </div>
            </div>
          </div>

          {/* AI Agent Config */}
          <div className="glass rounded-[var(--radius-xl)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-brand-indigo" />
              <h3 className="text-[14px] font-semibold tracking-tight">
                Konfigurasi AI Agent
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">HR Agent</div>
                  <div className="text-xs text-tertiary">
                    AI assistant untuk tim HRD
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-brand-teal/10 text-brand-teal border-brand-teal/20"
                >
                  Aktif
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    Hana Staff Agent
                  </div>
                  <div className="text-xs text-tertiary">
                    AI chatbot untuk karyawan via WhatsApp
                  </div>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  Segera Hadir
                </Badge>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          {isOperator && (
            <div className="glass rounded-[var(--radius-xl)] p-5 border border-brand-coral/20">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-brand-coral" />
                <h3 className="text-[14px] font-semibold tracking-tight text-brand-coral">
                  Zona Bahaya
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Suspend Tenant</div>
                  <div className="text-xs text-tertiary">
                    Nonaktifkan tenant dan semua layanannya
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-brand-coral border-brand-coral/30 hover:bg-brand-coral/10"
                  onClick={() =>
                    toast.info("Fitur suspend akan tersedia segera.")
                  }
                >
                  Suspend
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
