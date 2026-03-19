import type { ContractStatus } from "@/lib/types";

const styles: Record<ContractStatus, string> = {
  PKWTT: "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
  PKWT: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  Probation: "bg-brand-amber/10 text-[#b8921e] border-brand-amber/20",
};

export function ContractStatusChip({ status }: { status: ContractStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status]}`}
    >
      {status}
    </span>
  );
}
