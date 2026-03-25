"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterSelect } from "@/components/shared/filter-select";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import {
  BarChart3,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Target,
} from "lucide-react";

interface AssessmentCycle {
  id: string;
  name: string;
  period: string;
  status: "draft" | "active" | "completed";
  deadline: string;
  participant_count: number;
  response_count: number;
  created_at: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  active: {
    label: "Aktif",
    className:
      "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
    icon: Target,
  },
  completed: {
    label: "Selesai",
    className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    icon: CheckCircle,
  },
};

export default function AssessmentPage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [cycles, setCycles] = useState<AssessmentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newPeriod, setNewPeriod] = useState("Q1 2026");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    if (!selectedTenantId || tenantLoading) {
      setCycles([]);
      setLoading(false);
      return;
    }

    // Mock data for now — will be replaced with real API
    setLoading(false);
    setCycles([]);
  }, [selectedTenantId, tenantLoading]);

  function handleCreate() {
    if (!newName.trim()) {
      toast.error("Nama siklus wajib diisi");
      return;
    }

    // Mock create — will be replaced with real API
    const newCycle: AssessmentCycle = {
      id: `cycle-${Date.now()}`,
      name: newName,
      period: newPeriod,
      status: "draft",
      deadline: newDeadline || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      participant_count: 0,
      response_count: 0,
      created_at: new Date().toISOString(),
    };

    setCycles((prev) => [newCycle, ...prev]);
    setShowCreate(false);
    setNewName("");
    setNewDeadline("");
    toast.success("Siklus assessment berhasil dibuat");
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
              className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white"
            >
              Buat Siklus
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
            {cycles.map((cycle) => {
              const sc = statusConfig[cycle.status];
              const StatusIcon = sc.icon;
              const responseRate =
                cycle.participant_count > 0
                  ? Math.round(
                      (cycle.response_count / cycle.participant_count) * 100
                    )
                  : 0;

              return (
                <div
                  key={cycle.id}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-brand-indigo/[0.02] transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo/[0.08] flex items-center justify-center shrink-0">
                    <StatusIcon className="h-5 w-5 text-brand-indigo" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {cycle.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${sc.className}`}
                      >
                        {sc.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {cycle.period}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-tertiary">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cycle.participant_count} peserta
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline:{" "}
                        {new Date(cycle.deadline).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {cycle.participant_count > 0 && (
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Response rate: {responseRate}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
