"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import type { Tenant } from "@/lib/types";

interface TenantSelectorProps {
  tenants: Tenant[];
  selectedTenantId: string | null;
  onSelect: (tenantId: string) => void;
  disabled?: boolean;
}

export function TenantSelector({
  tenants,
  selectedTenantId,
  onSelect,
  disabled,
}: TenantSelectorProps) {
  if (tenants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-tertiary px-3 py-2 rounded-[var(--radius-sm)] bg-white/50 border border-white/80">
        <Building2 className="h-3.5 w-3.5" />
        Belum ada tenant
      </div>
    );
  }

  return (
    <Select
      value={selectedTenantId ?? undefined}
      onValueChange={(v) => v && onSelect(v)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[220px] h-9 text-xs">
        <Building2 className="h-3.5 w-3.5 mr-1.5 text-tertiary shrink-0" />
        <span className="truncate">
          {selectedTenantId
            ? tenants.find((t) => t.id === selectedTenantId)?.name ?? "Pilih Tenant"
            : "Pilih Tenant"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            <span className="text-xs">{tenant.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
