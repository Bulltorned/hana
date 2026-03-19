"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantFormDialog } from "@/components/shared/tenant-form-dialog";
import type { Tenant } from "@/lib/types";
import { Building2 } from "lucide-react";

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
          <div className="p-12 text-center text-tertiary text-sm">
            Memuat data...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada tenant.</p>
            <p className="text-xs mt-1">
              Klik &quot;Tambah Tenant&quot; untuk menambahkan tenant pertama.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Perusahaan</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="font-medium text-brand-indigo hover:underline"
                    >
                      {tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {planLabels[tenant.plan] ?? tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusStyles[tenant.status] ?? ""}
                    >
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-tertiary font-mono text-xs">
                    {new Date(tenant.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
