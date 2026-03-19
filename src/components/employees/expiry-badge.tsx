import { differenceInDays, parseISO } from "date-fns";

export function ExpiryBadge({ date }: { date: string | null }) {
  if (!date) return <span className="text-tertiary text-xs">—</span>;

  const days = differenceInDays(parseISO(date), new Date());

  if (days < 0) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-coral/12 text-[#d45a3d] font-mono">
        Expired
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-coral/12 text-[#d45a3d] font-mono">
        {days}d
      </span>
    );
  }

  if (days <= 90) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-amber/12 text-[#b8921e] font-mono">
        {days}d
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-teal/12 text-[#1a9980] font-mono">
      {days}d
    </span>
  );
}
