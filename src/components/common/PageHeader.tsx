import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[32px] font-bold leading-tight text-[#3F0000] sm:text-[36px]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] leading-6 text-[#737373]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
