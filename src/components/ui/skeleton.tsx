import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-brand-indigo/[0.06]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
