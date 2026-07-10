"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";

export interface PendingFeeItem {
  id: string;
  name: string;
  pendingMonths: number;
  amountDue: string | number;
  href?: string;
}

export interface PendingFeesCardProps {
  pendingMembers: PendingFeeItem[];
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  badge?: ReactNode;
  viewAllAction?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  maxRows?: number;
  className?: string;
}

export function PendingFeesCard({
  pendingMembers,
  title = "Pending Fees",
  description,
  headerAction,
  badge,
  viewAllAction,
  emptyTitle = "No pending fees",
  emptyDescription = "Pending fee records will appear here.",
  searchPlaceholder = "Search member...",
  maxRows = 5,
  className,
}: PendingFeesCardProps) {
  const columns: ColumnDef<PendingFeeItem, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold text-[#3F0000]">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "pendingMonths",
      header: "Pending Months",
      cell: ({ row }) => (
        <StatusBadge
          variant="Pending"
          label={`${row.original.pendingMonths} ${
            row.original.pendingMonths === 1 ? "Month" : "Months"
          }`}
        />
      ),
    },
    {
      accessorKey: "amountDue",
      header: "Amount Due",
      cell: ({ row }) => (
        <span className="font-semibold text-[#B91C1C]">
          {row.original.amountDue}
        </span>
      ),
    },
  ];

  const header = (
    <div className="flex items-center gap-2">
      {badge}
      {viewAllAction}
      {headerAction}
    </div>
  );

  return (
    <SectionCard
      title={title}
      description={description}
      headerAction={header}
      className={className}
      contentClassName="space-y-3"
    >
      {pendingMembers.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="min-h-32 shadow-none"
        />
      ) : (
        <DataTable
          columns={columns}
          data={pendingMembers.slice(0, maxRows)}
          enablePagination={false}
          searchPlaceholder={searchPlaceholder}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          rowActions={({ original }) =>
            original.href ? (
              <Button
                render={<Link href={original.href} />}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#9A3412] hover:bg-[#FFEADE]"
              >
                View
              </Button>
            ) : null
          }
        />
      )}
    </SectionCard>
  );
}
