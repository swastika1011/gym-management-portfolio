"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Home,
  LineChart,
  Users,
  CircleAlert,
} from "lucide-react";

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

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col border-r border-[#FFAA83] bg-white text-[#3F0000] shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-[#FFAA83] px-4">
        <div className="grid size-10 place-items-center rounded-2xl bg-[#FFEADE] text-[#9A3412]">
          <Dumbbell className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="[font-family:var(--font-manrope),sans-serif] text-[18px] font-semibold leading-6">
            Mad Muscles Gym
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
        <div className="flex items-center gap-3 rounded-2xl bg-[#FFEADE] p-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#9A3412] [font-family:var(--font-manrope),sans-serif] text-[15px] font-bold text-white">
            {user.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate [font-family:var(--font-manrope),sans-serif] text-[15px] font-semibold text-[#3F0000]">
              {user.name}
            </p>
            <p className="truncate [font-family:var(--font-raleway),sans-serif] text-[13px] text-[#737373]">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
