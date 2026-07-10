import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type QuickActionColor =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error";

export interface QuickActionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  href?: string;
  color?: QuickActionColor;
  className?: string;
}

const quickActionStyles: Record<QuickActionColor, string> = {
  primary: "border-[#FFAA83] bg-[#9A3412]/10 text-[#9A3412]",
  accent: "border-[#FFAA83] bg-[#800000]/10 text-[#800000]",
  success: "border-[#3F7D58]/20 bg-[#3F7D58]/10 text-[#3F7D58]",
  warning: "border-[#D97706]/20 bg-[#D97706]/10 text-[#D97706]",
  error: "border-[#B91C1C]/20 bg-[#B91C1C]/10 text-[#B91C1C]",
};

export function QuickAction({
  title,
  description,
  icon,
  href,
  color = "primary",
  className,
}: QuickActionProps) {
  const content = (
    <div
      className={cn(
        "group grid aspect-square min-h-32 place-items-center rounded-[18px] border p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
        quickActionStyles[color],
        href && "cursor-pointer",
        className
      )}
    >
      <div className="space-y-2">
        <div className="mx-auto grid size-10 place-items-center rounded-2xl bg-white/70 transition-transform group-hover:scale-105 [&_svg]:size-5">
          {icon}
        </div>
        <div>
          <h3 className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[16px] font-semibold leading-5">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 line-clamp-2 [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[13px] leading-5 text-[#737373]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block focus-visible:outline-none">
      {content}
    </Link>
  );
}
