interface ResponseProgressProps {
  responded: number;
  total: number;
}

export function ResponseProgress({ responded, total }: ResponseProgressProps) {
  const pct = total > 0 ? Math.round((responded / total) * 100) : 0;
  const color =
    pct >= 80
      ? "bg-brand-teal"
      : pct >= 60
        ? "bg-brand-amber"
        : pct > 0
          ? "bg-brand-coral"
          : "bg-muted";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-tertiary">
        {responded}/{total} ({pct}%)
      </span>
    </div>
  );
}
