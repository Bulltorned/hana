"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Check } from "lucide-react";
import type { Tenant } from "@/lib/types";

const planColors: Record<string, string> = {
  trial: "bg-muted text-muted-foreground",
  starter: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  growth: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  pro: "bg-brand-violet/10 text-brand-violet border-brand-violet/20",
};

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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.plan.toLowerCase().includes(q)
    );
  }, [tenants, search]);

  if (tenants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-tertiary px-3 py-2 rounded-[var(--radius-sm)] bg-white/50 border border-white/80">
        <Building2 className="h-3.5 w-3.5" />
        Belum ada tenant
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] text-xs font-medium bg-white/70 border border-white/90 hover:bg-white/90 backdrop-blur-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
      >
        <Building2 className="h-3.5 w-3.5 text-tertiary shrink-0" />
        <span className="truncate max-w-[160px]">
          {selectedTenant?.name ?? "Pilih Tenant"}
        </span>
        <svg
          className="h-3 w-3 text-tertiary shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[280px] p-0 overflow-hidden"
      >
        {/* Search */}
        <div className="p-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary" />
            <Input
              placeholder="Cari tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs border-0 bg-muted/50 focus-visible:ring-0"
              autoFocus
            />
          </div>
        </div>

        {/* Tenant List */}
        <div className="max-h-[240px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-tertiary">
              Tidak ditemukan
            </div>
          ) : (
            filtered.map((tenant) => {
              const isSelected = tenant.id === selectedTenantId;
              return (
                <button
                  key={tenant.id}
                  onClick={() => {
                    onSelect(tenant.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? "bg-brand-indigo/[0.08]"
                      : "hover:bg-muted/60"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white ${
                      isSelected
                        ? "bg-gradient-to-br from-brand-indigo to-brand-violet"
                        : "bg-gradient-to-br from-brand-indigo/60 to-brand-violet/60"
                    }`}
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {tenant.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 ${planColors[tenant.plan] ?? ""}`}
                      >
                        {tenant.plan}
                      </Badge>
                      <span className="text-[9px] text-tertiary capitalize">
                        {tenant.status}
                      </span>
                    </div>
                  </div>

                  {/* Check */}
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-brand-indigo shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/50">
          <div className="text-[10px] text-tertiary text-center">
            {tenants.length} tenant terdaftar
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
