"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CycleStatusBadge } from "@/components/assessment/cycle-status-badge";
import { ResponseProgress } from "@/components/assessment/response-progress";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  Calendar,
  Target,
  Play,
  CheckCircle,
  Loader2,
  UserPlus,
} from "lucide-react";

interface Rater {
  id: string;
  cycle_id: string;
  ratee_id: string;
  rater_id: string;
  rater_type: string;
  has_responded: boolean;
  responded_at: string | null;
  ratee?: { id: string; name: string; jabatan: string; divisi: string };
  rater?: { id: string; name: string; jabatan: string };
}

interface CycleDetail {
  id: string;
  tenant_id: string;
  name: string;
  period: string;
  deadline: string;
  status: "draft" | "active" | "completed";
  description: string | null;
  raters: Rater[];
  participant_count: number;
  rater_count: number;
  response_count: number;
  response_rate: number;
  created_at: string;
}

const raterTypeLabels: Record<string, string> = {
  manager: "Atasan",
  peer: "Rekan Kerja",
  direct_report: "Bawahan",
  self: "Self",
};

const raterTypeColors: Record<string, string> = {
  manager: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  peer: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  direct_report: "bg-brand-violet/10 text-brand-violet border-brand-violet/20",
  self: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
};

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCycle = useCallback(async () => {
    try {
      const res = await fetch(`/api/assessment/cycles/${cycleId}`);
      if (!res.ok) {
        router.push("/assessment");
        return;
      }
      setCycle(await res.json());
    } finally {
      setLoading(false);
    }
  }, [cycleId, router]);

  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/assessment/cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(
          newStatus === "active"
            ? "Siklus diaktifkan — survey siap didistribusikan"
            : "Siklus ditandai selesai"
        );
        fetchCycle();
      } else {
        toast.error("Gagal mengubah status");
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-tertiary" />
      </div>
    );
  }

  if (!cycle) return null;

  // Group raters by ratee
  const rateeMap = new Map<
    string,
    { ratee: Rater["ratee"]; raters: Rater[] }
  >();
  for (const r of cycle.raters) {
    const existing = rateeMap.get(r.ratee_id);
    if (existing) {
      existing.raters.push(r);
    } else {
      rateeMap.set(r.ratee_id, { ratee: r.ratee, raters: [r] });
    }
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
            onClick={() => router.push("/assessment")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight">
                {cycle.name}
              </h2>
              <CycleStatusBadge status={cycle.status} />
              <Badge variant="outline" className="text-[10px] font-mono">
                {cycle.period}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-tertiary">
              {cycle.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline:{" "}
                  {new Date(cycle.deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>
                Dibuat{" "}
                {new Date(cycle.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cycle.status === "draft" && (
            <Button
              onClick={() => handleStatusChange("active")}
              disabled={updating || cycle.rater_count === 0}
              className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-xs"
            >
              {updating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1.5" />
              )}
              Aktifkan Siklus
            </Button>
          )}
          {cycle.status === "active" && (
            <Button
              onClick={() => handleStatusChange("completed")}
              disabled={updating}
              variant="outline"
              className="text-xs"
            >
              {updating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Selesaikan
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <div className="text-xl font-bold font-mono">
            {cycle.participant_count}
          </div>
          <div className="text-[10px] text-tertiary">Peserta (Dinilai)</div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <div className="text-xl font-bold font-mono">
            {cycle.rater_count}
          </div>
          <div className="text-[10px] text-tertiary">Total Penilai</div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <div className="text-xl font-bold font-mono">
            {cycle.response_count}
          </div>
          <div className="text-[10px] text-tertiary">Respon Masuk</div>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-4">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold font-mono">
              {cycle.response_rate}%
            </div>
            {cycle.response_rate >= 80 && (
              <CheckCircle className="h-4 w-4 text-brand-teal" />
            )}
          </div>
          <div className="text-[10px] text-tertiary">Response Rate</div>
        </div>
      </div>

      {/* Participants & Raters */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-indigo/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight">
              Peserta & Penilai
            </h3>
            <p className="text-[11px] text-tertiary mt-0.5">
              {cycle.status === "draft"
                ? "Tambahkan peserta dan penilai sebelum mengaktifkan siklus"
                : "Daftar peserta dan progress penilaian"}
            </p>
          </div>
          {cycle.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() =>
                toast.info(
                  "Fitur tambah rater via UI sedang dikembangkan. Gunakan HR Agent: 'Tambahkan penilai untuk assessment'"
                )
              }
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Tambah Penilai
            </Button>
          )}
        </div>

        {rateeMap.size === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada peserta.</p>
            <p className="text-xs mt-1">
              Tambahkan karyawan yang akan dinilai beserta penilainya.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-indigo/[0.06]">
            {Array.from(rateeMap.entries()).map(([rateeId, { ratee, raters }]) => {
              const responded = raters.filter((r: Rater) => r.has_responded).length;

              return (
                <div key={rateeId} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo/20 to-brand-violet/20 flex items-center justify-center text-[10px] font-semibold text-brand-indigo">
                        {ratee?.name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {ratee?.name ?? "Unknown"}
                        </div>
                        <div className="text-[10px] text-tertiary">
                          {ratee?.jabatan} — {ratee?.divisi}
                        </div>
                      </div>
                    </div>
                    <ResponseProgress
                      responded={responded}
                      total={raters.length}
                    />
                  </div>

                  {/* Rater list */}
                  <div className="ml-10 flex flex-wrap gap-1.5">
                    {raters.map((r: Rater) => (
                      <div
                        key={r.id}
                        className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border ${
                          r.has_responded
                            ? "bg-brand-teal/5 border-brand-teal/20 text-brand-teal"
                            : "bg-white/50 border-white/80 text-tertiary"
                        }`}
                      >
                        <span>{r.rater?.name ?? "?"}</span>
                        <Badge
                          variant="outline"
                          className={`text-[8px] px-1 py-0 h-3.5 ${
                            raterTypeColors[r.rater_type] ?? ""
                          }`}
                        >
                          {raterTypeLabels[r.rater_type] ?? r.rater_type}
                        </Badge>
                        {r.has_responded && (
                          <CheckCircle className="h-2.5 w-2.5" />
                        )}
                      </div>
                    ))}
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
