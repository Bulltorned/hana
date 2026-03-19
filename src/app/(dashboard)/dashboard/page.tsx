"use client";

import { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AgentStatusPills } from "@/components/dashboard/agent-status-pills";

interface DashboardStats {
  totalEmployees: number;
  totalTenants: number;
  activeTenants: number;
  expiringContracts: number;
  compliancePending: number;
  docsThisMonth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total Karyawan"
          value={stats?.totalEmployees ?? 0}
          delta={
            stats?.expiringContracts
              ? `${stats.expiringContracts} kontrak akan habis`
              : "Semua kontrak aman"
          }
          deltaType={stats?.expiringContracts ? "down" : "neutral"}
          accentColor="#4F7BF7"
          iconBg="rgba(79,123,247,0.12)"
        />
        <StatCard
          icon={Building2}
          label="Total Tenant"
          value={stats?.totalTenants ?? 0}
          delta={
            stats?.activeTenants
              ? `${stats.activeTenants} aktif`
              : "Belum ada tenant"
          }
          deltaType={stats?.activeTenants ? "up" : "neutral"}
          accentColor="#26C6A6"
          iconBg="rgba(38,198,166,0.12)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Compliance Pending"
          value={stats?.compliancePending ?? 0}
          delta={
            stats?.compliancePending
              ? "Perlu ditangani"
              : "Tidak ada yang pending"
          }
          deltaType={stats?.compliancePending ? "down" : "neutral"}
          accentColor="#F76B4F"
          iconBg="rgba(247,107,79,0.12)"
        />
        <StatCard
          icon={FileText}
          label="Dokumen Bulan Ini"
          value={stats?.docsThisMonth ?? 0}
          delta="Dokumen yang di-generate"
          deltaType="neutral"
          accentColor="#7C5CF6"
          iconBg="rgba(124,92,246,0.12)"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
        {/* Compliance placeholder */}
        <div className="glass rounded-[var(--radius-xl)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Compliance Bulan Ini
            </h2>
          </div>
          <div className="text-center py-12 text-tertiary text-sm">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada compliance items.</p>
            <p className="text-xs mt-1">
              Data akan muncul setelah tenant dan karyawan ditambahkan.
            </p>
          </div>
        </div>

        {/* Agent status + activity */}
        <div className="flex flex-col gap-3">
          {/* Activity placeholder */}
          <div className="glass rounded-[var(--radius-xl)] p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold tracking-tight">
                Aktivitas Agent
              </h2>
              <span className="text-[11px] text-tertiary font-mono">Live</span>
            </div>
            <div className="text-center py-8 text-tertiary text-sm">
              <p>Belum ada aktivitas agent.</p>
            </div>
          </div>

          {/* Agent Status Pills */}
          <AgentStatusPills />
        </div>
      </div>
    </div>
  );
}
