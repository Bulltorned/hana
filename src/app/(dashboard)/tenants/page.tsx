"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TenantFormDialog } from "@/components/shared/tenant-form-dialog";
import type { Tenant } from "@/lib/types";
import { Building2 } from "lucide-react";
import { ListSkeleton } from "@/components/shared/list-skeleton";

const planLabels: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
};

const statusStyles: Record<string, string> = {
  active: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  provisioning: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  suspended: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-5 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Tenant Management
          </h2>
          <p className="text-xs text-tertiary mt-0.5">
            Kelola semua tenant yang terdaftar
          </p>
        </div>
        <TenantFormDialog onSuccess={fetchTenants} />
      </div>

      {/* Table */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada tenant.</p>
            <p className="text-xs mt-1">
              Klik &quot;Tambah Tenant&quot; untuk menambahkan tenant pertama.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-brand-indigo/[0.06]">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/tenants/${tenant.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-brand-indigo/[0.02] transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo/60 to-brand-violet/60 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {tenant.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {tenant.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusStyles[tenant.status] ?? ""}`}
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="font-mono text-[10px] h-4 px-1.5 py-0">
                      {planLabels[tenant.plan] ?? tenant.plan}
                    </Badge>
                    <span className="text-[11px] text-tertiary">
                      Dibuat {new Date(tenant.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <svg className="h-4 w-4 text-tertiary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
