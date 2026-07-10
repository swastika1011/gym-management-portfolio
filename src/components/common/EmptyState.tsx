import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-[18px] border border-dashed border-[#FFAA83] bg-white px-4 py-6 text-center shadow-sm",
        className
      )}
    >
      <div className="mb-3 grid size-10 place-items-center rounded-2xl bg-[#FFEADE] text-[#9A3412]">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </div>
      <h2 className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[18px] font-semibold text-[#3F0000]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-md [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] leading-6 text-[#737373]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
