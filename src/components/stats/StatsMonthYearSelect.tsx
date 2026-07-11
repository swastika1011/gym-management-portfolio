"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface StatsMonthYearSelectProps {
  selectedMonth: number;
  selectedYear: number;
  years: number[];
}

const months = [
  { label: "Jan", value: "1" },
  { label: "Feb", value: "2" },
  { label: "Mar", value: "3" },
  { label: "Apr", value: "4" },
  { label: "May", value: "5" },
  { label: "Jun", value: "6" },
  { label: "Jul", value: "7" },
  { label: "Aug", value: "8" },
  { label: "Sep", value: "9" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];

export function StatsMonthYearSelect({
  selectedMonth,
  selectedYear,
  years,
}: StatsMonthYearSelectProps) {
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
        <SelectTrigger className="h-9 w-28 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]">
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
        <SelectTrigger className="h-9 w-32 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]">
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
