"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { ComplianceStatusChip } from "@/components/compliance/compliance-status-chip";
import { ComplianceTypeIcon, getComplianceTypeLabel } from "@/components/compliance/compliance-type-icon";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import type { ComplianceItem, ComplianceStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";

export default function CompliancePage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const currentMonth = format(new Date(), "yyyy-MM");

  const fetchCompliance = useCallback(async () => {
    if (!selectedTenantId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        tenant_id: selectedTenantId,
      });
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/compliance?${params.toString()}`);
      if (res.ok) {
        setItems(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, filterStatus]);

  useEffect(() => {
    if (tenantLoading) return;
    setLoading(true);
    fetchCompliance();
  }, [fetchCompliance, tenantLoading]);

  async function handleGenerate() {
    if (!selectedTenantId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_monthly",
          tenant_id: selectedTenantId,
          month: currentMonth,
        }),
      });
      if (res.ok) {
        toast.success("Compliance items berhasil di-generate");
        fetchCompliance();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal generate compliance items");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkComplete(id: string) {
    const res = await fetch("/api/compliance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    if (res.ok) {
      toast.success("Item ditandai selesai");
      fetchCompliance();
    }
  }

  // Stats
  const overdue = items.filter((i) => i.status === "overdue").length;
  const dueSoon = items.filter((i) => i.status === "due_soon").length;
  const upcoming = items.filter((i) => i.status === "upcoming").length;
  const completed = items.filter((i) => i.status === "completed").length;

  function getDaysLabel(deadline: string): string {
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return `${Math.abs(days)} hari terlambat`;
    if (days === 0) return "Hari ini";
    if (days === 1) return "Besok";
    return `${days} hari lagi`;
  }

  function getDaysColor(deadline: string, status: ComplianceStatus): string {
    if (status === "completed" || status === "skipped") return "text-tertiary";
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return "text-brand-coral font-semibold";
    if (days <= 3) return "text-brand-amber font-semibold";
    return "text-tertiary";
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-coral/10 flex items-center justify-center">
            <AlertTriangle className="h-4.5 w-4.5 text-brand-coral" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{overdue}</div>
            <div className="text-[10px] text-tertiary">Terlambat</div>
          </div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-amber/10 flex items-center justify-center">
            <Clock className="h-4.5 w-4.5 text-brand-amber" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{dueSoon}</div>
            <div className="text-[10px] text-tertiary">Segera</div>
          </div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-indigo" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{upcoming}</div>
            <div className="text-[10px] text-tertiary">Mendatang</div>
          </div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center">
            <CheckCircle className="h-4.5 w-4.5 text-brand-teal" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{completed}</div>
            <div className="text-[10px] text-tertiary">Selesai</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3 flex-wrap">
        {isOperator && (
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={setSelectedTenantId}
          />
        )}

        <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="overdue">Terlambat</SelectItem>
            <SelectItem value="due_soon">Segera</SelectItem>
            <SelectItem value="upcoming">Mendatang</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={handleGenerate}
          disabled={!selectedTenantId || generating}
          className="text-xs"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Generate Bulan Ini
        </Button>
      </div>

      {/* List */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        {tenantLoading || loading ? (
          <div className="p-12 text-center text-tertiary text-sm">
            Memuat data...
          </div>
        ) : !selectedTenantId ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Pilih tenant terlebih dahulu.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada compliance items.</p>
            <p className="text-xs mt-1">
              Klik &quot;Generate Bulan Ini&quot; untuk membuat deadline bulan ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-indigo/[0.06]">
            {items.map((item) => (
              <div
                key={item.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-brand-indigo/[0.02] transition-colors"
              >
                <ComplianceTypeIcon type={item.type} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.title}
                    </span>
                    <ComplianceStatusChip status={item.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-tertiary">
                      {getComplianceTypeLabel(item.type)}
                    </span>
                    {item.employee && (
                      <span className="text-[11px] text-brand-indigo">
                        {item.employee.name}
                      </span>
                    )}
                    {item.description && (
                      <span className="text-[11px] text-tertiary truncate max-w-[300px]">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono text-muted-foreground">
                    {format(parseISO(item.deadline), "dd MMM yyyy", { locale: localeId })}
                  </div>
                  <div className={`text-[10px] ${getDaysColor(item.deadline, item.status)}`}>
                    {item.status === "completed"
                      ? "Selesai"
                      : getDaysLabel(item.deadline)}
                  </div>
                </div>

                {item.status !== "completed" && item.status !== "skipped" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-brand-teal hover:text-brand-teal hover:bg-brand-teal/10"
                    onClick={() => handleMarkComplete(item.id)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
