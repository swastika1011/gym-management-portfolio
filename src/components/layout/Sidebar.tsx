"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Home,
  LineChart,
  Users,
  CircleAlert,
  ChevronUp,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export interface SidebarUser {
  name: string;
  role: string;
  initials: string;
}

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  user?: SidebarUser;
}

const navItems: SidebarNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: Home },
  { title: "Members", href: "/admin/members", icon: Users },
  { title: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Pending Fees", href: "/admin/pending-fees", icon: CircleAlert },
  { title: "Stats", href: "/admin/stats", icon: LineChart },
  { title: "Revenue", href: "/admin/revenue", icon: BarChart3 },
];

const defaultUser: SidebarUser = {
  name: "Admin",
  role: "Administrator",
  initials: "A",
};

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  className,
  onNavigate,
  user = defaultUser,
}: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-r border-[#FFAA83] bg-white text-[#3F0000] shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-[#FFAA83] px-4">
  <div className="grid size-10 place-items-center overflow-hidden rounded-2xl bg-[#FFEADE]">
    <Image
      src="/logoo.png"
      alt="Gym Logo"
      width={40}
      height={40}
      className="object-contain"
    />
  </div>
        <div className="min-w-0">
          <p className="[font-family:var(--font-manrope),sans-serif] text-[18px] font-semibold leading-6">
            Fit Life Gym
          </p>
          <p className="[font-family:var(--font-raleway),sans-serif] text-[13px] text-[#737373]">
            Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 [font-family:var(--font-raleway),sans-serif] text-[15px] font-medium transition-colors",
                active
                  ? "bg-[#9A3412] text-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                  : "text-[#3F0000] hover:bg-[#FFEADE] hover:text-[#7C2D12]"
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[#FFAA83] p-3">
        <div className="rounded-2xl bg-[#FFEADE] p-3">
          <button
            type="button"
            onClick={() => setProfileOpen((isOpen) => !isOpen)}
            aria-expanded={profileOpen}
            className="flex w-full items-center gap-3 rounded-xl text-left outline-none transition-colors hover:bg-white/45 focus-visible:ring-2 focus-visible:ring-[#9A3412]"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#9A3412] [font-family:var(--font-manrope),sans-serif] text-[15px] font-bold text-white">
              {user.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate [font-family:var(--font-manrope),sans-serif] text-[15px] font-semibold text-[#3F0000]">
                {user.name}
              </p>
            </div>
            <ChevronUp
              className={cn(
                "ml-auto mr-1 size-4 shrink-0 text-[#9A3412] transition-transform duration-200",
                profileOpen ? "rotate-0" : "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
              profileOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="mb-2 px-2.5 [font-family:var(--font-raleway),sans-serif] text-[13px] text-[#737373]">
                {user.role}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="h-9 w-full justify-start rounded-xl px-2.5 text-[#9A3412] hover:bg-white/70 hover:text-[#7C2D12]"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
