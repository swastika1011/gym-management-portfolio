import { cn } from "@/lib/utils";

export interface MonthPaymentChipsProps {
  year: number;
  paidMonthKeys: Set<string>;
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthPaymentChips({
  year,
  paidMonthKeys,
}: MonthPaymentChipsProps) {
  const now = new Date();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {monthLabels.map((label, index) => {
        const month = index + 1;
        const isFuture =
          year > now.getFullYear() ||
          (year === now.getFullYear() && month > now.getMonth() + 1);
        const isPaid = paidMonthKeys.has(`${year}-${month}`);

        return (
          <div
            key={label}
            className={cn(
              "rounded-full border px-3 py-2 text-center text-[14px] font-semibold",
              isFuture
                ? "border-[#737373]/20 bg-[#737373]/10 text-[#737373]"
                : isPaid
                  ? "border-[#3F7D58]/20 bg-[#3F7D58]/10 text-[#3F7D58]"
                  : "border-[#B91C1C]/20 bg-[#B91C1C]/10 text-[#B91C1C]"
            )}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
