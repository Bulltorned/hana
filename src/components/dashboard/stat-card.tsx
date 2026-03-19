import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  accentColor: string;
  iconBg: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaType = "neutral",
  accentColor,
  iconBg,
}: StatCardProps) {
  return (
    <div className="glass rounded-[var(--radius-lg)] p-[18px_20px] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-hover cursor-default">
      {/* Accent blob */}
      <div
        className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-15 blur-[20px]"
        style={{ background: accentColor }}
      />

      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: accentColor }} />
      </div>

      <div className="text-[26px] font-[650] tracking-tight leading-none font-mono">
        {value}
      </div>
      <div className="text-xs text-tertiary mt-1">{label}</div>

      {delta && (
        <div
          className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-full ${
            deltaType === "up"
              ? "bg-brand-teal/[0.12] text-[#1a9980]"
              : deltaType === "down"
                ? "bg-brand-coral/[0.10] text-[#c4503a]"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {deltaType === "up" ? "↑" : deltaType === "down" ? "↓" : ""} {delta}
        </div>
      )}
    </div>
  );
}
