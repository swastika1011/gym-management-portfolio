import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "Active"
  | "Inactive"
  | "Paid"
  | "Pending"
  | "Admission"
  | "Monthly"
  | "Cash"
  | "UPI";

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
}

const statusBadgeStyles: Record<StatusBadgeVariant, string> = {
  Active: "border-[#3F7D58]/20 bg-[#3F7D58]/10 text-[#3F7D58]",
  Inactive: "border-[#737373]/20 bg-[#737373]/10 text-[#737373]",
  Paid: "border-[#3F7D58]/20 bg-[#3F7D58]/10 text-[#3F7D58]",
  Pending: "border-[#D97706]/20 bg-[#D97706]/10 text-[#D97706]",
  Admission: "border-[#9A3412]/20 bg-[#9A3412]/10 text-[#9A3412]",
  Monthly: "border-[#800000]/20 bg-[#800000]/10 text-[#800000]",
  Cash: "border-[#3F7D58]/20 bg-[#3F7D58]/10 text-[#3F7D58]",
  UPI: "border-[#800000]/20 bg-[#800000]/10 text-[#800000]",
};

export function StatusBadge({
  variant,
  label = variant,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full px-2.5 [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[12px] font-semibold",
        statusBadgeStyles[variant],
        className
      )}
    >
      {label}
    </Badge>
  );
}
