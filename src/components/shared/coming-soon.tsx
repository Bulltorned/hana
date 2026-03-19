import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

export function ComingSoon({ icon: Icon, title, description, phase }: ComingSoonProps) {
  return (
    <div className="glass rounded-[var(--radius-xl)] p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 mb-4">
        <Icon className="h-8 w-8 text-brand-indigo opacity-60" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-tertiary bg-muted px-2.5 py-1 rounded-full">
        {phase}
      </span>
    </div>
  );
}
