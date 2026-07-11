"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RevenueMonthYearSelectProps {
  selectedMonth: number;
  selectedYear: number;
  years: number[];
}

const months = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export function RevenueMonthYearSelect({
  selectedMonth,
  selectedYear,
  years,
}: RevenueMonthYearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: "month" | "year", value: string | null) {
    if (!pathname || value === null) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Select
        value={String(selectedMonth)}
        onValueChange={(value) => updateParam("month", value)}
      >
        <SelectTrigger className="h-9 w-36 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]">
          <CalendarDays className="size-4 text-[#9A3412]" strokeWidth={1.75} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="end"
          alignItemWithTrigger={false}
          className="!min-w-0 w-[var(--anchor-width)] p-1"
        >
          {months.map((month) => (
            <SelectItem
              key={month.value}
              value={month.value}
              className="rounded-lg px-2 py-1 text-[#3F0000] focus:bg-transparent data-[highlighted]:bg-transparent"
            >
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(selectedYear)}
        onValueChange={(value) => updateParam("year", value)}
      >
        <SelectTrigger className="h-9 w-28 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="end"
          alignItemWithTrigger={false}
          className="!min-w-0 w-[var(--anchor-width)] p-1"
        >
          {years.map((year) => (
            <SelectItem
              key={year}
              value={String(year)}
              className="rounded-lg px-2 py-1 text-[#3F0000] focus:bg-transparent data-[highlighted]:bg-transparent"
            >
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
