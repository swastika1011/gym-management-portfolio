"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";

import type { MemberData } from "@/actions/member.actions";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { MemberDeleteButton } from "@/components/members/MemberDeleteButton";
import { formatDate } from "@/components/members/member-utils";

export interface MembersTableProps {
  members: MemberData[];
}

type StatusFilter = "all" | "active" | "inactive";

export function MembersTable({ members }: MembersTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (statusFilter === "active" && !member.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && member.isActive) {
        return false;
      }

      return true;
    });
  }, [members, statusFilter]);

  const columns = useMemo<ColumnDef<MemberData, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#3F0000]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "mobileNumber",
        header: "Mobile Number",
      },
      {
        accessorKey: "category",
        header: "Category",
      },
      {
        accessorKey: "joinDate",
        header: "Join Date",
        cell: ({ row }) => formatDate(row.original.joinDate),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge variant={row.original.isActive ? "Active" : "Inactive"} />
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={filteredMembers}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name or mobile number..."
      emptyTitle="No members found"
      emptyDescription="Add a member or adjust your search and filter."
      toolbarAction={
        <div className="flex rounded-xl border border-[#FFAA83] bg-white p-1">
          {[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value as StatusFilter)}
              className={`rounded-lg px-3 py-1.5 text-[14px] font-semibold transition ${
                statusFilter === item.value
                  ? "bg-[#9A3412] text-white"
                  : "text-[#3F0000] hover:bg-[#FFEADE]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      rowActions={({ original }) => (
        <>
          <Button
            render={<Link href={`/admin/members/${original._id}`} />}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
          >
            <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" />
            View
          </Button>
          <Button
            render={<Link href={`/admin/members/${original._id}/edit`} />}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
          >
            <Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Edit
          </Button>
          <MemberDeleteButton
            memberId={original._id}
            memberName={original.name}
            redirectTo="/admin/members"
          />
        </>
      )}
    />
  );
}
