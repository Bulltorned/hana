import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3">
        <Skeleton className="h-9 w-[220px] rounded-lg" />
        <Skeleton className="h-9 w-[160px] rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-[130px] rounded-lg" />
      </div>

      {/* Document List */}
      <div className="glass rounded-[var(--radius-xl)] p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-4 w-14 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-2.5 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
