import type { Employee } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface EmployeeStatsStripProps {
  employees: Employee[];
  loading?: boolean;
  onFilterClick?: (filter: string) => void;
}

export function EmployeeStatsStrip({
  employees,
  loading,
  onFilterClick,
}: EmployeeStatsStripProps) {
  const active = employees.filter((e) => !e.is_archived);
  const pkwtt = active.filter((e) => e.status_kontrak === "PKWTT").length;
  const pkwt = active.filter((e) => e.status_kontrak === "PKWT").length;
  const expiring = active.filter((e) => {
    if (!e.tgl_berakhir) return false;
    const days = differenceInDays(parseISO(e.tgl_berakhir), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const stats = [
    { label: "Total Aktif", value: active.length, filter: "" },
    { label: "PKWTT", value: pkwtt, filter: "PKWTT" },
    { label: "PKWT", value: pkwt, filter: "PKWT" },
    {
      label: "Berakhir ≤30 hari",
      value: expiring,
      filter: "expiring",
      urgent: expiring > 0,
    },
  ];

  if (loading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass rounded-[var(--radius-sm)] px-3.5 py-2"
          >
            <Skeleton className="h-5 w-8 mb-1" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {stats.map((stat) => (
        <button
          key={stat.label}
          onClick={() => onFilterClick?.(stat.filter)}
          className={`glass rounded-[var(--radius-sm)] px-3.5 py-2 text-left transition-all hover:-translate-y-0.5 cursor-pointer ${
            stat.urgent ? "border-brand-coral/30" : ""
          }`}
        >
          <div
            className={`text-lg font-[650] font-mono leading-none ${
              stat.urgent ? "text-brand-coral" : ""
            }`}
          >
            {stat.value}
          </div>
          <div className="text-[10px] text-tertiary mt-0.5">{stat.label}</div>
        </button>
      ))}
    </div>
  );
}
