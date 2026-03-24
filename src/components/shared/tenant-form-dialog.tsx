"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/shared/filter-select";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface TenantFormDialogProps {
  onSuccess?: () => void;
}

export function TenantFormDialog({ onSuccess }: TenantFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Controlled form state
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("starter");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setPlan("starter");
    setStatus("active");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nama perusahaan wajib diisi");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), plan, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Gagal membuat tenant");
        return;
      }

      toast.success("Tenant berhasil dibuat");
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Gagal membuat tenant");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-[550] bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30 hover:opacity-90 transition-opacity cursor-pointer">
        <Plus className="h-4 w-4" />
        Tambah Tenant
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tenant Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Nama Perusahaan</Label>
            <Input
              id="tenant-name"
              placeholder="PT Maju Jaya"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
            />
            {error && (
              <p className="text-xs text-urgent">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <FilterSelect
              value={plan}
              onChange={setPlan}
              placeholder="Pilih plan"
              width="w-full"
              options={[
                { value: "trial", label: "Trial" },
                { value: "starter", label: "Starter — Rp 2.5jt/bln" },
                { value: "growth", label: "Growth — Rp 6jt/bln" },
                { value: "pro", label: "Pro — Rp 15jt/bln" },
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
                { value: "active", label: "Active" },
                { value: "provisioning", label: "Provisioning" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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
              ) : (
                "Simpan"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
