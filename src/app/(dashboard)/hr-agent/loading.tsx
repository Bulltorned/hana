import { Skeleton } from "@/components/ui/skeleton";

export default function HRAgentLoading() {
  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="glass rounded-[var(--radius-xl)] p-4 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-20 mb-1.5" />
          <Skeleton className="h-2.5 w-36" />
        </div>
        <Skeleton className="h-9 w-[220px] rounded-lg" />
      </div>

      {/* Chat Area */}
      <div className="glass rounded-[var(--radius-xl)] flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-4" />
            <Skeleton className="h-4 w-40 mx-auto mb-2" />
            <Skeleton className="h-3 w-64 mx-auto mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-brand-indigo/[0.06]">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
