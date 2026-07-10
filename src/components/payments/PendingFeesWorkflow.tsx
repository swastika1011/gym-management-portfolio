"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, IndianRupee, Users } from "lucide-react";

import type { MemberData } from "@/actions/member.actions";
import type {
  PaymentData,
  PendingFeeQueueItem,
  PendingFeesSummaryData,
  PaymentType,
} from "@/actions/payment.actions";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RecordPaymentDialog,
  type RecordPaymentInitialValues,
} from "@/components/payments/RecordPaymentDialog";
import { formatCurrency } from "@/components/members/member-utils";

type PendingFeeRow = PendingFeeQueueItem & {
  id: string;
  name: string;
  mobileNumber: string;
  category: "Male" | "Female" | "Student";
};

export interface PendingFeesWorkflowProps {
  summary: PendingFeesSummaryData;
  members: MemberData[];
  payments: PaymentData[];
  yearOptions: number[];
}

function memberValue(member: Record<string, unknown>, key: string) {
  return typeof member[key] === "string" ? member[key] : "";
}

function oldestPendingLabel(row: PendingFeeRow) {
  if (!row.oldestPendingMonth) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(
    new Date(row.oldestPendingMonth.year, row.oldestPendingMonth.month - 1, 1)
  );
}

export function PendingFeesWorkflow({
  summary,
  members,
  payments,
  yearOptions,
}: PendingFeesWorkflowProps) {
  const router = useRouter();
  const [feeType, setFeeType] = useState("All");
  const [category, setCategory] = useState("All");
  const [pendingMonths, setPendingMonths] = useState("All");
  const [dialogValues, setDialogValues] =
    useState<RecordPaymentInitialValues | null>(null);
  const rows = useMemo<PendingFeeRow[]>(
    () =>
      summary.items.map((item) => ({
        ...item,
        id: String(item.member._id ?? ""),
        name: memberValue(item.member, "name"),
        mobileNumber: memberValue(item.member, "mobileNumber"),
        category: memberValue(item.member, "category") as PendingFeeRow["category"],
      })),
    [summary.items]
  );
  const filteredRows = rows.filter((row) => {
    const feeTypeMatch =
      feeType === "All" ||
      row.feeType === feeType ||
      (feeType === "Admission" && row.feeType === "Admission + Monthly") ||
      (feeType === "Monthly" && row.feeType === "Admission + Monthly");
    const categoryMatch = category === "All" || row.category === category;
    const monthsMatch =
      pendingMonths === "All" ||
      (pendingMonths === "1" && row.pendingMonths === 1) ||
      (pendingMonths === "2" && row.pendingMonths === 2) ||
      (pendingMonths === "3+" && row.pendingMonths >= 3);

    return feeTypeMatch && categoryMatch && monthsMatch;
  });
  const columns: ColumnDef<PendingFeeRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <span className="font-semibold text-[#3F0000]">{row.original.name}</span>
      ),
    },
    { accessorKey: "mobileNumber", header: "Mobile Number" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "feeType",
      header: "Fee Type",
      cell: ({ row }) => (
        <StatusBadge
          variant={row.original.feeType === "Monthly" ? "Monthly" : "Admission"}
          label={row.original.feeType}
        />
      ),
    },
    {
      accessorKey: "pendingMonths",
      header: "Pending Months",
      cell: ({ row }) =>
        row.original.pendingMonths > 0 ? (
          <StatusBadge
            variant="Pending"
            label={`${row.original.pendingMonths} ${
              row.original.pendingMonths === 1 ? "Month" : "Months"
            }`}
          />
        ) : (
          "-"
        ),
    },
    {
      accessorKey: "outstandingAmount",
      header: "Outstanding Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-[#B91C1C]">
          {formatCurrency(row.original.outstandingAmount)}
        </span>
      ),
    },
    {
      id: "oldestPendingMonth",
      header: "Oldest Pending Month",
      cell: ({ row }) => oldestPendingLabel(row.original),
    },
  ];

  function openCollectPayment(row: PendingFeeRow) {
    const paymentType: PaymentType =
      row.admissionDue > 0 ? "Admission" : "Monthly";
    setDialogValues({
      memberId: row.id,
      paymentType,
      paymentForMonth: row.oldestPendingMonth?.month,
      paymentForYear: row.oldestPendingMonth?.year,
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pending Fees"
        description="View members with outstanding fees and quickly collect payments."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Members With Pending Fees"
          value={summary.pendingMembersCount}
          description="Members with unpaid fees"
          icon={<Users strokeWidth={1.75} />}
          color="warning"
        />
        <StatCard
          title="Total Outstanding Amount"
          value={formatCurrency(summary.totalOutstandingAmount)}
          description="Admission and monthly dues"
          icon={<IndianRupee strokeWidth={1.75} />}
          color="accent"
        />
      </section>

      <SectionCard title="Pending Fee Queue">
        <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <SelectFilter
            value={feeType}
            onChange={setFeeType}
            label="Fee Type"
            options={["All", "Monthly", "Admission"]}
          />
          <SelectFilter
            value={category}
            onChange={setCategory}
            label="Category"
            options={["All", "Male", "Female", "Student"]}
          />
          <SelectFilter
            value={pendingMonths}
            onChange={setPendingMonths}
            label="Pending Months"
            options={["All", "1", "2", "3+"]}
            labels={{ "1": "1 Month", "2": "2 Months", "3+": "3+ Months" }}
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredRows}
          searchPlaceholder="Search member or mobile..."
          initialPageSize={15}
          emptyTitle="No pending fees"
          emptyDescription="Members with outstanding fees will appear here."
          onRowClick={(row) => router.push(`/admin/members/${row.original.id}`)}
          rowActions={({ original }) => (
            <Button
              type="button"
              onClick={() => openCollectPayment(original)}
              className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
              size="sm"
            >
              <CreditCard className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Collect Payment
            </Button>
          )}
        />
      </SectionCard>

      {dialogValues ? (
        <RecordPaymentDialog
          key={`${dialogValues.memberId}-${dialogValues.paymentType}-${dialogValues.paymentForMonth}-${dialogValues.paymentForYear}`}
          open={Boolean(dialogValues)}
          onOpenChange={(open) => !open && setDialogValues(null)}
          members={members}
          allPayments={payments}
          yearOptions={yearOptions}
          initialValues={dialogValues}
          onSuccess={() => setDialogValues(null)}
        />
      ) : null}
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  label,
  options,
  labels = {},
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger
        aria-label={label}
        className="h-10 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[var(--anchor-width)] p-1"
      >
        {options.map((option) => (
          <SelectItem key={option} value={option} className="rounded-lg text-[#3F0000]">
            {labels[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
