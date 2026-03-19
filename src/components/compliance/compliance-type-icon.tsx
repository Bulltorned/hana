import {
  Heart,
  Shield,
  Receipt,
  FileText,
  Gift,
  AlertTriangle,
  ClipboardCheck,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ComplianceType } from "@/lib/types";

const typeConfig: Record<ComplianceType, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  bpjs_kesehatan: {
    icon: Heart,
    color: "#E74C3C",
    bg: "rgba(231,76,60,0.10)",
    label: "BPJS Kesehatan",
  },
  bpjs_ketenagakerjaan: {
    icon: Shield,
    color: "#3498DB",
    bg: "rgba(52,152,219,0.10)",
    label: "BPJS Ketenagakerjaan",
  },
  pph21_setor: {
    icon: Receipt,
    color: "#9B59B6",
    bg: "rgba(155,89,182,0.10)",
    label: "PPh 21 Setor",
  },
  pph21_lapor: {
    icon: FileText,
    color: "#8E44AD",
    bg: "rgba(142,68,173,0.10)",
    label: "PPh 21 Lapor",
  },
  thr: {
    icon: Gift,
    color: "#F39C12",
    bg: "rgba(243,156,18,0.10)",
    label: "THR",
  },
  pkwt_expiry: {
    icon: AlertTriangle,
    color: "#E67E22",
    bg: "rgba(230,126,34,0.10)",
    label: "PKWT Expiry",
  },
  bpjs_registration: {
    icon: ClipboardCheck,
    color: "#1ABC9C",
    bg: "rgba(26,188,156,0.10)",
    label: "Registrasi BPJS",
  },
  other: {
    icon: HelpCircle,
    color: "#95A5A6",
    bg: "rgba(149,165,166,0.10)",
    label: "Lainnya",
  },
};

export function ComplianceTypeIcon({ type }: { type: ComplianceType }) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: config.bg }}
    >
      <Icon className="h-4.5 w-4.5" style={{ color: config.color }} />
    </div>
  );
}

export function getComplianceTypeLabel(type: ComplianceType): string {
  return typeConfig[type]?.label ?? type;
}
