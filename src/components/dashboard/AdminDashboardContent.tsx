"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarCheck,
  CalendarPlus,
  CreditCard,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PendingFeesCard,
  type PendingFeeItem,
} from "@/components/dashboard/PendingFeesCard";
import {
  RecentPaymentsCard,
  type RecentPaymentItem,
} from "@/components/dashboard/RecentPaymentsCard";
import { QuickAction } from "@/components/dashboard/QuickAction";
import { StatCard } from "@/components/dashboard/StatCard";

export interface DashboardAttendanceItem {
  id: string;
  name: string;
  timeIn: string;
  timeOut: string;
  status: "Checked In" | "Checked Out";
}

export interface AdminDashboardContentProps {
  stats: {
    totalMembers: number;
    activeMembers: number;
    todayAttendance: number;
  };
  pendingFees: PendingFeeItem[];
  recentPayments: RecentPaymentItem[];
  todayAttendance: DashboardAttendanceItem[];
  currentDate: string;
}

const attendanceColumns: ColumnDef<DashboardAttendanceItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-semibold text-[#3F0000]">{row.original.name}</span>
    ),
  },
  { accessorKey: "timeIn", header: "Time In" },
  { accessorKey: "timeOut", header: "Time Out" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        variant="Active"
        label={row.original.status}
        className={
          row.original.status === "Checked Out"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : undefined
        }
      />
    ),
  },
];

function ViewAllButton({ href }: { href: string }) {
  return (
    <Button
      render={<Link href={href} />}
      variant="outline"
      size="sm"
      className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
    >
      View All
    </Button>
  );
}

export function AdminDashboardContent({
  stats,
  pendingFees,
  recentPayments,
  todayAttendance,
  currentDate,
}: AdminDashboardContentProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={"Welcome back, Admin! \u{1F44B}"}
        action={
          <div className="rounded-xl border border-[#FFAA83] bg-white px-3 py-2 text-[14px] font-medium text-[#3F0000] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {currentDate}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          description="All registered members"
          icon={<Users strokeWidth={1.75} />}
          color="primary"
          href="/admin/members"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          description="Currently active members"
          icon={<UserCheck strokeWidth={1.75} />}
          color="success"
          href="/admin/members"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          description="Members checked in today"
          icon={<CalendarCheck strokeWidth={1.75} />}
          color="accent"
          href="/admin/attendance"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <PendingFeesCard
          title="Pending Fees"
          pendingMembers={pendingFees}
          badge={
            <Badge className="h-6 rounded-full border border-[#D97706]/20 bg-[#D97706]/10 px-2.5 text-[12px] font-semibold text-[#D97706]">
              {pendingFees.length} Members
            </Badge>
          }
          viewAllAction={<ViewAllButton href="/admin/pending-fees" />}
          maxRows={5}
        />

        <RecentPaymentsCard
          title="Recent Payments"
          payments={recentPayments}
          viewAllAction={<ViewAllButton href="/admin/payments" />}
          maxRows={5}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <SectionCard
          title="Today's Attendance"
          headerAction={<ViewAllButton href="/admin/attendance" />}
        >
          <DataTable
            columns={attendanceColumns}
            data={todayAttendance}
            searchPlaceholder="Search attendance..."
            enablePagination={false}
            emptyTitle="No attendance marked today"
            emptyDescription="Today's attendance records will appear here."
          />
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickAction
              title="Add Member"
              icon={<UserPlus strokeWidth={1.75} />}
              href="/admin/members/new"
              color="primary"
            />
            <QuickAction
              title="Mark Attendance"
              icon={<CalendarPlus strokeWidth={1.75} />}
              href="/admin/attendance"
              color="success"
            />
            <QuickAction
              title="Record Payment"
              icon={<CreditCard strokeWidth={1.75} />}
              href="/admin/payments"
              color="accent"
            />
            <QuickAction
              title="Members"
              icon={<Users strokeWidth={1.75} />}
              href="/admin/members"
              color="warning"
            />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
