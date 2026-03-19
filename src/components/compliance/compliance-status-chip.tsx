import { Badge } from "@/components/ui/badge";
import type { ComplianceStatus } from "@/lib/types";

const statusConfig: Record<ComplianceStatus, { label: string; className: string }> = {
  upcoming: {
    label: "Upcoming",
    className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  },
  due_soon: {
    label: "Segera",
    className: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
  },
  overdue: {
    label: "Terlambat",
    className: "bg-brand-coral/10 text-brand-coral border-brand-coral/20",
  },
  completed: {
    label: "Selesai",
    className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  },
  skipped: {
    label: "Dilewati",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export function ComplianceStatusChip({ status }: { status: ComplianceStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[10px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}
