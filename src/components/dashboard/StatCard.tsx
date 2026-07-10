import type { ReactNode } from "react";
import Link from "next/link";

import { SectionCard } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

export type StatCardColor =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  color: StatCardColor;
  href?: string;
  className?: string;
}

const statColorStyles: Record<
  StatCardColor,
  { icon: string; value: string; hover: string }
> = {
  primary: {
    icon: "bg-[#9A3412]/10 text-[#9A3412]",
    value: "text-[#9A3412]",
    hover: "hover:border-[#9A3412]/40",
  },
  accent: {
    icon: "bg-[#800000]/10 text-[#800000]",
    value: "text-[#800000]",
    hover: "hover:border-[#800000]/40",
  },
  success: {
    icon: "bg-[#3F7D58]/10 text-[#3F7D58]",
    value: "text-[#3F7D58]",
    hover: "hover:border-[#3F7D58]/40",
  },
  warning: {
    icon: "bg-[#D97706]/10 text-[#D97706]",
    value: "text-[#D97706]",
    hover: "hover:border-[#D97706]/40",
  },
  error: {
    icon: "bg-[#B91C1C]/10 text-[#B91C1C]",
    value: "text-[#B91C1C]",
    hover: "hover:border-[#B91C1C]/40",
  },
};

export function StatCard({
  title,
  value,
  description,
  icon,
  color,
  href,
  className,
}: StatCardProps) {
  const content = (
    <SectionCard
      className={cn(
        "h-full transition-all hover:-translate-y-0.5",
        statColorStyles[color].hover,
        className
      )}
      contentClassName="flex items-center gap-4"
    >
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl [&_svg]:size-6",
          statColorStyles[color].icon
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[18px] font-semibold leading-6 text-[#3F0000]">
          {title}
        </p>
        <p
          className={cn(
            "mt-1 [font-family:Manrope,var(--font-geist-sans),sans-serif] text-3xl font-bold leading-none",
            statColorStyles[color].value
          )}
        >
          {value}
        </p>
        {description ? (
          <p className="mt-2 [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] leading-5 text-[#737373]">
            {description}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block h-full focus-visible:outline-none">
      {content}
    </Link>
  );
}
