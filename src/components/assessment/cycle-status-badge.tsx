import { Badge } from "@/components/ui/badge";
import { FileText, Target, CheckCircle } from "lucide-react";

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  active: {
    label: "Aktif",
    className: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
    icon: Target,
  },
  completed: {
    label: "Selesai",
    className: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    icon: CheckCircle,
  },
} as const;

interface CycleStatusBadgeProps {
  status: "draft" | "active" | "completed";
}

export function CycleStatusBadge({ status }: CycleStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[10px] ${config.className}`}>
      {config.label}
    </Badge>
  );
}
