import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

export function LoadingState({
  rows = 3,
  showHeader = true,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[#FFAA83] bg-white p-4 shadow-sm",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      {showHeader ? (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-40 rounded-full bg-[#FFAA83]/70" />
          <Skeleton className="h-4 w-64 max-w-full rounded-full bg-[#FFAA83]/50" />
        </div>
      ) : null}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-10 w-full rounded-2xl bg-[#FFAA83]/50"
          />
        ))}
      </div>
      <span className="sr-only">Loading content</span>
    </div>
  );
}
