"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

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

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-20 rounded-xl border-[#FFAA83] bg-white/95 text-[#3F0000] shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur hover:bg-[#FFEADE]"
              aria-label="Open navigation"
            />
          }
        >
          <Menu className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] border-[#FFAA83] bg-white p-0" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Navigate between admin sections.</SheetDescription>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
