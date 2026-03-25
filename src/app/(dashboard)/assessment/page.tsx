"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSelect } from "@/components/shared/filter-select";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { CycleStatusBadge } from "@/components/assessment/cycle-status-badge";
import { ResponseProgress } from "@/components/assessment/response-progress";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import {
  BarChart3,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  FileText,
  Target,
  Trash2,
} from "lucide-react";

interface AssessmentCycleWithStats {
  id: string;
  tenant_id: string;
  name: string;
  period: string;
  deadline: string;
  status: "draft" | "active" | "completed";
  participant_count: number;
  rater_count: number;
  response_count: number;
  created_at: string;
}

export default function AssessmentPage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [cycles, setCycles] = useState<AssessmentCycleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  // Create form
  const [newName, setNewName] = useState("");
  const [newPeriod, setNewPeriod] = useState("Q1 2026");
  const [newDeadline, setNewDeadline] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCycles = useCallback(async () => {
    if (!selectedTenantId) {
      setCycles([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ tenant_id: selectedTenantId });
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/assessment/cycles?${params.toString()}`);
      if (res.ok) {
        setCycles(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, filterStatus]);

  useEffect(() => {
    if (tenantLoading) return;
    setLoading(true);
    fetchCycles();
  }, [fetchCycles, tenantLoading]);

  async function handleCreate() {
    if (!newName.trim() || !selectedTenantId) {
      toast.error("Nama siklus wajib diisi");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/assessment/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: selectedTenantId,
          name: newName.trim(),
          period: newPeriod,
          deadline: newDeadline || null,
        }),
      });

      if (res.ok) {
        toast.success("Siklus assessment berhasil dibuat");
        setShowCreate(false);
        setNewName("");
        setNewDeadline("");
        fetchCycles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal membuat siklus");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(cycleId: string) {
    const res = await fetch(`/api/assessment/cycles/${cycleId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Siklus berhasil dihapus");
      fetchCycles();
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal menghapus siklus");
    }
  }

  // Stats
  const active = cycles.filter((c) => c.status === "active").length;
  const draft = cycles.filter((c) => c.status === "draft").length;
  const completed = cycles.filter((c) => c.status === "completed").length;
  const totalParticipants = cycles.reduce(
    (sum, c) => sum + c.participant_count,
    0
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
            <Target className="h-4.5 w-4.5 text-brand-indigo" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{active}</div>
            <div className="text-[10px] text-tertiary">Siklus Aktif</div>
          </div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-amber/10 flex items-center justify-center">
            <FileText className="h-4.5 w-4.5 text-brand-amber" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">{draft}</div>
            <div className="text-[10px] text-tertiary">Draft</div>
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
        <div className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-violet/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-brand-violet" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono">
              {totalParticipants}
            </div>
            <div className="text-[10px] text-tertiary">Total Peserta</div>
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

        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
          width="w-[140px]"
          options={[
            { value: "all", label: "Semua Status" },
            { value: "draft", label: "Draft" },
            { value: "active", label: "Aktif" },
            { value: "completed", label: "Selesai" },
          ]}
        />

        <div className="flex-1" />

        <Button
          onClick={() => setShowCreate(!showCreate)}
          disabled={!selectedTenantId}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30 text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Buat Siklus Baru
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <h3 className="text-[14px] font-semibold tracking-tight mb-4">
            Buat Siklus Assessment Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nama Siklus</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Review Kinerja Q1 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Periode</Label>
              <FilterSelect
                value={newPeriod}
                onChange={setNewPeriod}
                placeholder="Pilih periode"
                width="w-full"
                options={[
                  { value: "Q1 2026", label: "Q1 2026 (Jan-Mar)" },
                  { value: "Q2 2026", label: "Q2 2026 (Apr-Jun)" },
                  { value: "Q3 2026", label: "Q3 2026 (Jul-Sep)" },
                  { value: "Q4 2026", label: "Q4 2026 (Okt-Des)" },
                  { value: "H1 2026", label: "H1 2026 (Jan-Jun)" },
                  { value: "H2 2026", label: "H2 2026 (Jul-Des)" },
                  { value: "2026", label: "Tahunan 2026" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
            >
              {creating ? "Membuat..." : "Buat Siklus"}
            </Button>
          </div>
        </div>
      )}

      {/* Cycle List */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        {tenantLoading || loading ? (
          <ListSkeleton rows={4} />
        ) : !selectedTenantId ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Pilih tenant terlebih dahulu.</p>
          </div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada siklus assessment.</p>
            <p className="text-xs mt-1">
              Klik &quot;Buat Siklus Baru&quot; untuk memulai penilaian kinerja
              360°.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-indigo/[0.06]">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="px-5 py-4 flex items-center gap-4 hover:bg-brand-indigo/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-indigo/[0.08] flex items-center justify-center shrink-0">
                  {cycle.status === "active" ? (
                    <Target className="h-5 w-5 text-brand-indigo" />
                  ) : cycle.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-brand-teal" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/assessment/${cycle.id}`}
                      className="text-sm font-medium truncate hover:text-brand-indigo transition-colors"
                    >
                      {cycle.name}
                    </Link>
                    <CycleStatusBadge status={cycle.status} />
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono"
                    >
                      {cycle.period}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-tertiary">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {cycle.participant_count} peserta
                    </span>
                    {cycle.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline:{" "}
                        {new Date(cycle.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {cycle.rater_count > 0 && (
                      <ResponseProgress
                        responded={cycle.response_count}
                        total={cycle.rater_count}
                      />
                    )}
                  </div>
                </div>

                {cycle.status === "draft" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-tertiary hover:text-brand-coral"
                    onClick={() => handleDelete(cycle.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
