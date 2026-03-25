"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/shared/filter-select";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { NewDocumentDialog } from "@/components/documents/new-document-dialog";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import type { DocumentRequest, DocType, DocStatus } from "@/lib/types";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import {
  FileText,
  FileCheck,
  FileClock,
  FileWarning,
  Download,
} from "lucide-react";

const docTypeLabels: Record<DocType, string> = {
  pkwt: "PKWT",
  pkwtt: "PKWTT",
  sp1: "SP 1",
  sp2: "SP 2",
  sp3: "SP 3",
  phk: "PHK",
  offer_letter: "Offer Letter",
  surat_keterangan: "Surat Keterangan",
  surat_mutasi: "Surat Mutasi",
  other: "Lainnya",
};

const statusConfig: Record<DocStatus, { label: string; className: string; icon: typeof FileText }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground", icon: FileText },
  generating: { label: "Generating...", className: "bg-brand-amber/10 text-brand-amber border-brand-amber/20", icon: FileClock },
  ready: { label: "Siap", className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20", icon: FileCheck },
  signed: { label: "Signed", className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20", icon: FileCheck },
  archived: { label: "Arsip", className: "bg-muted text-muted-foreground", icon: FileWarning },
};

export default function DocumentsPage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [docs, setDocs] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchDocs = useCallback(async () => {
    if (!selectedTenantId) {
      setDocs([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ tenant_id: selectedTenantId });
      if (filterType !== "all") params.set("doc_type", filterType);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        setDocs(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, filterType]);

  useEffect(() => {
    if (tenantLoading) return;
    setLoading(true);
    fetchDocs();
  }, [fetchDocs, tenantLoading]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3 flex-wrap">
        {isOperator && (
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={setSelectedTenantId}
          />
        )}

        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          placeholder="Jenis Dokumen"
          width="w-[160px]"
          options={[
            { value: "all", label: "Semua Jenis" },
            ...Object.entries(docTypeLabels).map(([key, label]) => ({
              value: key,
              label,
            })),
          ]}
        />

        <div className="flex-1" />

        {selectedTenantId && (
          <NewDocumentDialog tenantId={selectedTenantId} onSuccess={fetchDocs} />
        )}
      </div>

      {/* Document List */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        {tenantLoading || loading ? (
          <ListSkeleton rows={4} />
        ) : !selectedTenantId ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Pilih tenant terlebih dahulu.</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada dokumen.</p>
            <p className="text-xs mt-1">
              Klik &quot;Buat Dokumen&quot; untuk membuat dokumen baru.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-indigo/[0.06]">
            {docs.map((doc) => {
              const sc = statusConfig[doc.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={doc.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-brand-indigo/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo/[0.08] flex items-center justify-center shrink-0">
                    <StatusIcon className="h-5 w-5 text-brand-indigo" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {doc.title}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${sc.className}`}>
                        {sc.label}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {docTypeLabels[doc.doc_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {doc.employee && (
                        <span className="text-[11px] text-brand-indigo">
                          {doc.employee.name} — {doc.employee.jabatan}
                        </span>
                      )}
                      <span className="text-[11px] text-tertiary">
                        {format(parseISO(doc.created_at), "dd MMM yyyy HH:mm", { locale: localeId })}
                      </span>
                    </div>
                  </div>

                  {doc.output_url && (
                    <a
                      href={doc.output_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-8 h-8 rounded-lg bg-brand-teal/10 flex items-center justify-center hover:bg-brand-teal/20 transition-colors"
                    >
                      <Download className="h-4 w-4 text-brand-teal" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
