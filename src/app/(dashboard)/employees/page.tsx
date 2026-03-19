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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeStatsStrip } from "@/components/employees/employee-stats-strip";
import { ContractStatusChip } from "@/components/employees/contract-status-chip";
import { ExpiryBadge } from "@/components/employees/expiry-badge";
import { EmployeeSidePanel } from "@/components/employees/employee-side-panel";
import { CSVImportDialog } from "@/components/employees/csv-import-dialog";
import type { Employee } from "@/lib/types";
import { Plus, Search, Users } from "lucide-react";

// Placeholder tenant_id — will be dynamic once tenant context is wired
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDivisi, setFilterDivisi] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
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
  }, [search, filterStatus, filterDivisi]);

  useEffect(() => {
    const timer = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <Input
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PKWTT">PKWTT</SelectItem>
            <SelectItem value="PKWT">PKWT</SelectItem>
            <SelectItem value="Probation">Probation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterDivisi} onValueChange={(v) => setFilterDivisi(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Divisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Divisi</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CSVImportDialog
          tenantId={DEMO_TENANT_ID}
          onSuccess={fetchEmployees}
        />

        <Button
          onClick={() => {
            setEditingEmployee(null);
            setPanelOpen(true);
          }}
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
        {loading ? (
          <div className="p-12 text-center text-tertiary text-sm">
            Memuat data...
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
      <EmployeeSidePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        employee={editingEmployee}
        tenantId={DEMO_TENANT_ID}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
