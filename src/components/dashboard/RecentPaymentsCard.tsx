"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/common/StatusBadge";

export interface RecentPaymentItem {
  id: string;
  name: string;
  paymentType: "Admission" | "Monthly" | string;
  amount: string | number;
  paymentMode: "Cash" | "UPI" | string;
  paymentDate: string;
}

export interface RecentPaymentsCardProps {
  payments: RecentPaymentItem[];
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  viewAllAction?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  maxRows?: number;
  className?: string;
}

function paymentTypeVariant(paymentType: string): StatusBadgeVariant | null {
  if (paymentType === "Admission" || paymentType === "Monthly") {
    return paymentType;
  }

  return null;
}

function paymentModeVariant(paymentMode: string): StatusBadgeVariant | null {
  if (paymentMode === "Cash" || paymentMode === "UPI") {
    return paymentMode;
  }

  return null;
}

export function RecentPaymentsCard({
  payments,
  title = "Recent Payments",
  description,
  headerAction,
  viewAllAction,
  emptyTitle = "No recent payments",
  emptyDescription = "Payment records will appear here.",
  searchPlaceholder = "Search payment...",
  maxRows = 5,
  className,
}: RecentPaymentsCardProps) {
  const columns: ColumnDef<RecentPaymentItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold text-[#3F0000]">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "paymentType",
      header: "Payment Type",
      cell: ({ row }) => {
        const typeVariant = paymentTypeVariant(row.original.paymentType);

        return typeVariant ? (
          <StatusBadge variant={typeVariant} />
        ) : (
          <span className="font-medium text-[#3F0000]">
            {row.original.paymentType}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-[#3F7D58]">
          {row.original.amount}
        </span>
      ),
    },
    {
      accessorKey: "paymentMode",
      header: "Payment Mode",
      cell: ({ row }) => {
        const modeVariant = paymentModeVariant(row.original.paymentMode);

        return modeVariant ? (
          <StatusBadge variant={modeVariant} />
        ) : (
          <span className="font-medium text-[#3F0000]">
            {row.original.paymentMode}
          </span>
        );
      },
    },
    {
      accessorKey: "paymentDate",
      header: "Date",
    },
  ];

  return (
    <SectionCard
      title={title}
      description={description}
      headerAction={
        <div className="flex items-center gap-2">
          {viewAllAction}
          {headerAction}
        </div>
      }
      className={className}
    >
      {payments.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="min-h-32 shadow-none"
        />
      ) : (
        <DataTable
          columns={columns}
          data={payments.slice(0, maxRows)}
          searchPlaceholder={searchPlaceholder}
          enablePagination={false}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}
    </SectionCard>
  );
}
