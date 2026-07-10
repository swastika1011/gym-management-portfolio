"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
}

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className,
  inputClassName,
  "aria-label": ariaLabel,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#737373]"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 rounded-xl border-[#FFAA83] bg-white pl-9 pr-3 [font-family:Raleway,var(--font-geist-sans),sans-serif] text-[15px] text-[#3F0000] shadow-sm placeholder:text-[#737373] focus-visible:border-[#9A3412] focus-visible:ring-[#9A3412]/20",
          inputClassName
        )}
      />
    </div>
  );
}
