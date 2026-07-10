"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HeatmapYearSelectProps {
  selectedYear: number;
  years: number[];
}

export function HeatmapYearSelect({
  selectedYear,
  years,
}: HeatmapYearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={String(selectedYear)}
      onValueChange={(value) => {
      if (!pathname || value === null) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("year", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }}
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
  );
}
