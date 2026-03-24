"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/filter-select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeStatsStrip } from "@/components/employees/employee-stats-strip";
import { ContractStatusChip } from "@/components/employees/contract-status-chip";
import { ExpiryBadge } from "@/components/employees/expiry-badge";
import { EmployeeSidePanel } from "@/components/employees/employee-side-panel";
import { CSVImportDialog } from "@/components/employees/csv-import-dialog";
import { TenantSelector } from "@/components/shared/tenant-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantContext } from "@/lib/hooks/use-tenant-context";
import type { Employee } from "@/lib/types";
import { Plus, Search, Users } from "lucide-react";

export default function EmployeesPage() {
  const {
    tenants,
    selectedTenantId,
    setSelectedTenantId,
    isOperator,
    loading: tenantLoading,
  } = useTenantContext();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDivisi, setFilterDivisi] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!selectedTenantId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("tenant_id", selectedTenantId);
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status_kontrak", filterStatus);
      if (filterDivisi !== "all") params.set("divisi", filterDivisi);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        setEmployees(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId, search, filterStatus, filterDivisi]);

  useEffect(() => {
    if (tenantLoading) return;
    setLoading(true);
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees, tenantLoading]);

  const divisions = Array.from(new Set(employees.map((e) => e.divisi).filter(Boolean)));

  const allSelected =
    employees.length > 0 && selectedIds.size === employees.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((e) => e.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function truncate(str: string, len: number) {
    if (!str) return "—";
    if (str.length <= len) return str;
    return str.slice(0, len) + "...";
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats Strip */}
      <EmployeeStatsStrip
        employees={employees}
        loading={tenantLoading || loading}
        onFilterClick={(filter) => {
          if (filter === "expiring") {
            // Could add special filter later
          } else if (filter) {
            setFilterStatus(filter);
          } else {
            setFilterStatus("all");
          }
        }}
      />

      {/* Toolbar */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3 flex-wrap">
        {/* Tenant selector for operators */}
        {isOperator && (
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelect={setSelectedTenantId}
          />
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
          width="w-[140px]"
          options={[
            { value: "all", label: "Semua Status" },
            { value: "PKWTT", label: "PKWTT" },
            { value: "PKWT", label: "PKWT" },
            { value: "Probation", label: "Probation" },
          ]}
        />

        <FilterSelect
          value={filterDivisi}
          onChange={setFilterDivisi}
          placeholder="Divisi"
          width="w-[140px]"
          options={[
            { value: "all", label: "Semua Divisi" },
            ...divisions.map((d) => ({ value: d, label: d })),
          ]}
        />

        {selectedTenantId && (
          <CSVImportDialog
            tenantId={selectedTenantId}
            onSuccess={fetchEmployees}
          />
        )}

        <Button
          onClick={() => {
            setEditingEmployee(null);
            setPanelOpen(true);
          }}
          disabled={!selectedTenantId}
          className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Karyawan
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="glass rounded-[var(--radius-sm)] px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs font-medium">
            {selectedIds.size} dipilih
          </span>
          <Button variant="outline" size="sm" className="text-xs h-7">
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 text-urgent"
            onClick={() => setSelectedIds(new Set())}
          >
            Batal Pilih
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-[var(--radius-xl)] overflow-hidden">
        {tenantLoading || loading ? (
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-3.5 w-28 mb-1" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-24 flex-1" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : !selectedTenantId ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Pilih tenant terlebih dahulu.</p>
            <p className="text-xs mt-1">
              Buat tenant baru di halaman Tenants jika belum ada.
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-tertiary text-sm">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada karyawan.</p>
            <p className="text-xs mt-1">
              Klik &quot;Tambah Karyawan&quot; atau import dari CSV.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan / Divisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tgl Mulai</TableHead>
                <TableHead>Tgl Berakhir</TableHead>
                <TableHead>BPJS Kes</TableHead>
                <TableHead>NPWP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="cursor-pointer hover:bg-brand-indigo/[0.03]"
                  onClick={() => {
                    setEditingEmployee(emp);
                    setPanelOpen(true);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(emp.id)}
                      onCheckedChange={() => toggleSelect(emp.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-brand-indigo/20 to-brand-violet/20 text-brand-indigo text-[10px] font-semibold">
                          {getInitials(emp.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{emp.name}</div>
                        {emp.employee_id && (
                          <div className="text-[10px] text-tertiary font-mono">
                            {emp.employee_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{emp.jabatan}</div>
                    <div className="text-[10px] text-tertiary">{emp.divisi}</div>
                  </TableCell>
                  <TableCell>
                    <ContractStatusChip status={emp.status_kontrak} />
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {format(parseISO(emp.tgl_mulai), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {emp.tgl_berakhir
                          ? format(parseISO(emp.tgl_berakhir), "dd MMM yyyy", {
                              locale: localeId,
                            })
                          : "—"}
                      </span>
                      <ExpiryBadge date={emp.tgl_berakhir} />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-tertiary">
                    {truncate(emp.no_bpjs_kes, 8)}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-tertiary">
                    {truncate(emp.npwp, 10)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Side Panel */}
      {selectedTenantId && (
        <EmployeeSidePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          employee={editingEmployee}
          tenantId={selectedTenantId}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
}
