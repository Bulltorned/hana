"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTenantSchema,
  type CreateTenantInput,
} from "@/lib/validations/tenant";
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
import { Plus } from "lucide-react";

interface TenantFormDialogProps {
  onSuccess?: () => void;
}

export function TenantFormDialog({ onSuccess }: TenantFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      plan: "starter",
      status: "active",
    },
  });

  async function onSubmit(data: CreateTenantInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create tenant");

      reset();
      setOpen(false);
      onSuccess?.();
    } catch {
      // Error handling — could add toast here
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-[550] bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30 hover:opacity-90 transition-opacity cursor-pointer">
        <Plus className="h-4 w-4" />
        Tambah Tenant
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tenant Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Perusahaan</Label>
            <Input
              id="name"
              placeholder="PT Maju Jaya"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-urgent">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <FilterSelect
              value={watch("plan")}
              onChange={(v) =>
                setValue("plan", v as CreateTenantInput["plan"])
              }
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
              value={watch("status")}
              onChange={(v) =>
                setValue("status", v as CreateTenantInput["status"])
              }
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
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
