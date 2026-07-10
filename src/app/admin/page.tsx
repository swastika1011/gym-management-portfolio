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

interface AttendancePreviewItem {
  id: string;
  name: string;
  timeIn: string;
  timeOut: string;
  status: "Checked In" | "Checked Out";
}

const dashboardStats = {
  totalMembers: 148,
  activeMembers: 132,
  todayAttendance: 91,
};

const pendingFees: PendingFeeItem[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    pendingMonths: 2,
    amountDue: "\u20B91,800",
    href: "/admin/members/1",
  },
  {
    id: "2",
    name: "Priya Patel",
    pendingMonths: 1,
    amountDue: "\u20B9900",
    href: "/admin/members/2",
  },
  {
    id: "3",
    name: "Amit Kumar",
    pendingMonths: 3,
    amountDue: "\u20B92,700",
    href: "/admin/members/3",
  },
  {
    id: "4",
    name: "Sandeep Singh",
    pendingMonths: 1,
    amountDue: "\u20B9900",
    href: "/admin/members/4",
  },
  {
    id: "5",
    name: "Neha Verma",
    pendingMonths: 2,
    amountDue: "\u20B91,800",
    href: "/admin/members/5",
  },
];

const recentPayments: RecentPaymentItem[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    paymentType: "Monthly",
    amount: "\u20B9900",
    paymentMode: "Cash",
    paymentDate: "Today, 10:15 AM",
  },
  {
    id: "2",
    name: "Priya Patel",
    paymentType: "Admission",
    amount: "\u20B91,200",
    paymentMode: "UPI",
    paymentDate: "Today, 09:45 AM",
  },
  {
    id: "3",
    name: "Amit Kumar",
    paymentType: "Monthly",
    amount: "\u20B9900",
    paymentMode: "Cash",
    paymentDate: "Yesterday, 07:30 PM",
  },
  {
    id: "4",
    name: "Sandeep Singh",
    paymentType: "Monthly",
    amount: "\u20B9900",
    paymentMode: "UPI",
    paymentDate: "Yesterday, 06:10 PM",
  },
  {
    id: "5",
    name: "Neha Verma",
    paymentType: "Monthly",
    amount: "\u20B9900",
    paymentMode: "Cash",
    paymentDate: "Yesterday, 05:05 PM",
  },
];

const todayAttendance: AttendancePreviewItem[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    timeIn: "06:30 AM",
    timeOut: "08:45 AM",
    status: "Checked Out",
  },
  {
    id: "2",
    name: "Priya Patel",
    timeIn: "06:45 AM",
    timeOut: "-",
    status: "Checked In",
  },
  {
    id: "3",
    name: "Amit Kumar",
    timeIn: "07:05 AM",
    timeOut: "09:10 AM",
    status: "Checked Out",
  },
  {
    id: "4",
    name: "Sandeep Singh",
    timeIn: "07:15 AM",
    timeOut: "-",
    status: "Checked In",
  },
  {
    id: "5",
    name: "Neha Verma",
    timeIn: "07:20 AM",
    timeOut: "08:30 AM",
    status: "Checked Out",
  },
];

const attendanceColumns: ColumnDef<AttendancePreviewItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-semibold text-[#3F0000]">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "timeIn",
    header: "Time In",
  },
  {
    accessorKey: "timeOut",
    header: "Time Out",
  },
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

function currentDateLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={"Welcome back, Admin! \u{1F44B}"}
        action={
          <div className="rounded-xl border border-[#FFAA83] bg-white px-3 py-2 text-[14px] font-medium text-[#3F0000] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            {currentDateLabel()}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Members"
          value={dashboardStats.totalMembers}
          description="All registered members"
          icon={<Users strokeWidth={1.75} />}
          color="primary"
          href="/admin/members"
        />
        <StatCard
          title="Active Members"
          value={dashboardStats.activeMembers}
          description="Currently active members"
          icon={<UserCheck strokeWidth={1.75} />}
          color="success"
          href="/admin/members"
        />
        <StatCard
          title="Today's Attendance"
          value={dashboardStats.todayAttendance}
          description="Members checked in today"
          icon={<CalendarCheck strokeWidth={1.75} />}
          color="accent"
          href="/admin/attendance"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <PendingFeesCard
          title="Pending Monthly Fees"
          pendingMembers={pendingFees}
          badge={
            <Badge className="h-6 rounded-full border border-[#D97706]/20 bg-[#D97706]/10 px-2.5 text-[12px] font-semibold text-[#D97706]">
              {pendingFees.length} Members
            </Badge>
          }
          viewAllAction={<ViewAllButton href="/admin/payments" />}
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
            data={todayAttendance.slice(0, 5)}
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
              href="/admin/attendance/new"
              color="success"
            />
            <QuickAction
              title="Record Payment"
              icon={<CreditCard strokeWidth={1.75} />}
              href="/admin/payments/new"
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
