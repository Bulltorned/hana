import { Skeleton } from "@/components/ui/skeleton";

export default function ComplianceLoading() {
  return (
    <div className="flex flex-col gap-3">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-[var(--radius-lg)] p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div>
              <Skeleton className="h-5 w-8 mb-1" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3">
        <Skeleton className="h-9 w-[220px] rounded-lg" />
        <Skeleton className="h-9 w-[160px] rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-[150px] rounded-lg" />
      </div>

      {/* List */}
      <div className="glass rounded-[var(--radius-xl)] p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-48 mb-1.5" />
              <Skeleton className="h-2.5 w-32" />
            </div>
            <div className="text-right">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-2.5 w-16 ml-auto" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
