"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface NavbarProps {
  action?: ReactNode;
  className?: string;
}

const routeTitles: Array<{ href: string; title: string }> = [
  { href: "/admin/members", title: "Members" },
  { href: "/admin/attendance", title: "Attendance" },
  { href: "/admin/payments", title: "Payments" },
  { href: "/admin/plans", title: "Revenue" },
  { href: "/admin", title: "Dashboard" },
];

function getRouteTitle(pathname: string) {
  return (
    routeTitles.find((route) => {
      if (route.href === "/admin") {
        return pathname === route.href;
      }

      return pathname === route.href || pathname.startsWith(`${route.href}/`);
    })?.title ?? "Admin"
  );
}

function getCurrentDate() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Navbar({ action, className }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = getRouteTitle(pathname);
  const currentDate = useMemo(() => getCurrentDate(), []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-[#FFAA83] bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:px-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-[#FFAA83] text-[#3F0000] hover:bg-[#FFEADE] lg:hidden"
                  aria-label="Open navigation"
                />
              }
            >
              <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[240px] border-[#FFAA83] bg-white p-0"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Admin navigation</SheetTitle>
                <SheetDescription>Navigate between admin sections.</SheetDescription>
              </SheetHeader>
              <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h1 className="truncate [font-family:var(--font-manrope),sans-serif] text-[32px] font-bold leading-tight text-[#3F0000]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-[#FFAA83] bg-white px-3 py-2 [font-family:var(--font-raleway),sans-serif] text-[14px] font-medium text-[#3F0000] sm:flex">
            <CalendarDays
              className="size-4 text-[#9A3412]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {currentDate}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </header>
  );
}
