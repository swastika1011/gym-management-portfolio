import type { ReactNode } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  headerAction,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  const hasHeader = title || description || headerAction;

  return (
    <Card
      className={cn(
        "rounded-[18px] border border-[#FFAA83] bg-white shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {hasHeader ? (
        <CardHeader className="gap-1.5 px-4 pt-4 sm:px-5 sm:pt-5">
          {title ? (
            <CardTitle className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[18px] font-semibold text-[#3F0000]">
              {title}
            </CardTitle>
          ) : null}
          {description ? (
            <CardDescription className="[font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] text-[#737373]">
              {description}
            </CardDescription>
          ) : null}
          {headerAction ? <CardAction>{headerAction}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(
          "px-4 pb-4 [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] text-[#3F0000] sm:px-5 sm:pb-5",
          !hasHeader && "pt-4 sm:pt-5",
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
