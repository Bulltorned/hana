"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { DocumentRequest, DocType, DocStatus } from "@/lib/types";
import {
  ArrowLeft,
  FileText,
  Save,
  Loader2,
  Trash2,
  Download,
  Bot,
  FileCheck,
  Sparkles,
} from "lucide-react";

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

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  generating: {
    label: "Generating...",
    className: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  },
  ready: {
    label: "Siap",
    className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  },
  signed: {
    label: "Signed",
    className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  },
  archived: { label: "Arsip", className: "bg-muted text-muted-foreground" },
};

interface DocEmployee {
  id: string;
  name: string;
  jabatan: string;
  divisi: string;
  status_kontrak: string;
  tgl_mulai: string;
  tgl_berakhir: string | null;
}

interface DocWithEmployee extends Omit<DocumentRequest, "employee"> {
  employee?: DocEmployee;
  draft_content?: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [doc, setDoc] = useState<DocWithEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState("");

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) {
        router.push("/documents");
        return;
      }
      const data: DocWithEmployee = await res.json();
      setDoc(data);
      setDraftContent(data.draft_content ?? "");
    } finally {
      setLoading(false);
    }
  }, [docId, router]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  async function handleSaveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_content: draftContent }),
      });
      if (res.ok) {
        toast.success("Draft berhasil disimpan");
        fetchDoc();
      } else {
        toast.error("Gagal menyimpan draft");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateDraft() {
    if (!doc) return;
    setGenerating(true);

    try {
      // Call chat API to generate document content
      const prompt = buildGeneratePrompt(doc);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: doc.tenant_id,
          session_id: `doc-gen-${docId}`,
          content: prompt,
        }),
      });

      if (res.ok) {
        // Read streamed response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "text") {
                    fullText += data.text;
                    setDraftContent(fullText);
                  } else if (data.type === "done") {
                    fullText = data.fullText;
                  }
                } catch {
                  // skip
                }
              }
            }
          }
        }

        // Save to database
        if (fullText) {
          await fetch(`/api/documents/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              draft_content: fullText,
              status: "ready",
            }),
          });
          toast.success("Draft dokumen berhasil di-generate");
          fetchDoc();
        }
      }
    } catch {
      toast.error("Gagal generate draft");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Hapus dokumen ini?")) return;

    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Dokumen berhasil dihapus");
      router.push("/documents");
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal menghapus dokumen");
    }
  }

  async function handleMarkReady() {
    const res = await fetch(`/api/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    });
    if (res.ok) {
      toast.success("Dokumen ditandai siap");
      fetchDoc();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-tertiary" />
      </div>
    );
  }

  if (!doc) return null;

  const sc = statusConfig[doc.status];

  return (
    <div className="flex flex-col gap-3 max-w-5xl">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/documents")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight">
                {doc.title}
              </h2>
              <Badge variant="outline" className={`text-[10px] ${sc.className}`}>
                {sc.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {docTypeLabels[doc.doc_type]}
              </Badge>
            </div>
            <p className="text-xs text-tertiary mt-0.5">
              Dibuat{" "}
              {new Date(doc.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc.status === "draft" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-brand-coral"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Hapus
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleMarkReady}
                disabled={!draftContent}
              >
                <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                Tandai Siap
              </Button>
            </>
          )}
          {doc.output_url && (
            <a
              href={doc.output_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Employee Info */}
      {doc.employee && (
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <h3 className="text-[13px] font-semibold tracking-tight mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-indigo" />
            Informasi Karyawan
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-tertiary mb-0.5">Nama</div>
              <div className="font-medium">{doc.employee.name}</div>
            </div>
            <div>
              <div className="text-tertiary mb-0.5">Jabatan</div>
              <div className="font-medium">{doc.employee.jabatan}</div>
            </div>
            <div>
              <div className="text-tertiary mb-0.5">Divisi</div>
              <div className="font-medium">{doc.employee.divisi}</div>
            </div>
            <div>
              <div className="text-tertiary mb-0.5">Status Kontrak</div>
              <div className="font-medium">{doc.employee.status_kontrak}</div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Content */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-indigo" />
            Isi Dokumen
          </h3>
          <div className="flex items-center gap-2">
            {!draftContent && doc.status === "draft" && (
              <Button
                size="sm"
                onClick={handleGenerateDraft}
                disabled={generating}
                className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-xs"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Generate dengan AI
              </Button>
            )}
            {draftContent && doc.status === "draft" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDraft}
                  disabled={generating}
                  className="text-xs"
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Re-generate
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="text-xs"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Simpan Draft
                </Button>
              </>
            )}
          </div>
        </div>

        {generating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-brand-indigo mb-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI sedang generate dokumen...
            </div>
            <div className="bg-white/50 rounded-xl p-5 min-h-[400px] text-sm leading-relaxed whitespace-pre-wrap font-mono border border-brand-indigo/10">
              {draftContent || "..."}
            </div>
          </div>
        ) : draftContent ? (
          doc.status === "draft" ? (
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
              placeholder="Isi dokumen..."
            />
          ) : (
            <div className="bg-white/50 rounded-xl p-5 min-h-[400px] text-sm leading-relaxed whitespace-pre-wrap border border-white/80">
              {draftContent}
            </div>
          )
        ) : (
          <div className="text-center py-16 text-tertiary text-sm">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada isi dokumen.</p>
            <p className="text-xs mt-1">
              Klik &quot;Generate dengan AI&quot; untuk membuat draft otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Notes / Variables */}
      {doc.variables && Object.keys(doc.variables).length > 0 && (
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <h3 className="text-[13px] font-semibold tracking-tight mb-3">
            Catatan & Variabel
          </h3>
          <div className="text-xs text-muted-foreground space-y-1">
            {Object.entries(doc.variables).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-mono text-tertiary">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: Build prompt for AI document generation ──
function buildGeneratePrompt(doc: DocWithEmployee): string {
  const type = docTypeLabels[doc.doc_type] ?? doc.doc_type;
  const emp = doc.employee;

  let prompt = `Generate dokumen "${type}" dengan format resmi Indonesia.\n\n`;
  prompt += `Judul: ${doc.title}\n`;

  if (emp) {
    prompt += `\nData Karyawan:\n`;
    prompt += `- Nama: ${emp.name}\n`;
    prompt += `- Jabatan: ${emp.jabatan}\n`;
    prompt += `- Divisi: ${emp.divisi}\n`;
    prompt += `- Status Kontrak: ${emp.status_kontrak}\n`;
    if (emp.tgl_mulai) prompt += `- Tanggal Mulai: ${emp.tgl_mulai}\n`;
    if (emp.tgl_berakhir) prompt += `- Tanggal Berakhir: ${emp.tgl_berakhir}\n`;
  }

  if (doc.variables) {
    const notes = (doc.variables as Record<string, unknown>).notes;
    if (notes) prompt += `\nCatatan tambahan: ${notes}\n`;
  }

  prompt += `\nBuatkan draft dokumen lengkap dalam format yang siap digunakan. Gunakan bahasa formal Indonesia yang sesuai dengan regulasi ketenagakerjaan.`;

  return prompt;
}
