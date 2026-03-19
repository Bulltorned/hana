"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee, DocType } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

const docTypeLabels: Record<DocType, string> = {
  pkwt: "Kontrak PKWT",
  pkwtt: "Kontrak PKWTT",
  sp1: "Surat Peringatan 1",
  sp2: "Surat Peringatan 2",
  sp3: "Surat Peringatan 3",
  phk: "Surat PHK",
  offer_letter: "Offer Letter",
  surat_keterangan: "Surat Keterangan Kerja",
  surat_mutasi: "Surat Mutasi",
  other: "Lainnya",
};

interface NewDocumentDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function NewDocumentDialog({ tenantId, onSuccess }: NewDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form
  const [docType, setDocType] = useState<DocType>("pkwt");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !tenantId) return;
    fetch(`/api/employees?tenant_id=${tenantId}`)
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, [open, tenantId]);

  // Auto-generate title when doc type or employee changes
  useEffect(() => {
    const emp = employees.find((e) => e.id === employeeId);
    if (emp) {
      setTitle(`${docTypeLabels[docType]} — ${emp.name}`);
    } else {
      setTitle(docTypeLabels[docType]);
    }
  }, [docType, employeeId, employees]);

  async function handleSubmit() {
    if (!title) {
      toast.error("Judul dokumen wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          employee_id: employeeId || null,
          doc_type: docType,
          title,
          variables: { notes },
        }),
      });

      if (res.ok) {
        toast.success("Permintaan dokumen berhasil dibuat");
        setOpen(false);
        resetForm();
        onSuccess?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal membuat dokumen");
      }
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setDocType("pkwt");
    setEmployeeId("");
    setTitle("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30">
          <Plus className="h-4 w-4 mr-1.5" />
          Buat Dokumen
        </Button>
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Dokumen Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Jenis Dokumen</Label>
            <Select value={docType} onValueChange={(v) => v && setDocType(v as DocType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(docTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Karyawan (opsional)</Label>
            <Select value={employeeId} onValueChange={(v) => v && setEmployeeId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih karyawan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tidak terkait karyawan —</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.jabatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Judul Dokumen</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul dokumen..."
            />
          </div>

          <div className="space-y-2">
            <Label>Catatan / Instruksi Tambahan</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kontrak untuk posisi baru di divisi Marketing, mulai 1 April 2026..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Buat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
