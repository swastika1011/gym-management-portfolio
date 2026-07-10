"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/common/DataTable";
import {
  type AttendanceRecord,
  formatDate,
  formatTime,
} from "@/components/members/member-utils";

export interface RecentAttendanceTableProps {
  attendance: AttendanceRecord[];
}

export function RecentAttendanceTable({
  attendance,
}: RecentAttendanceTableProps) {
  const columns: ColumnDef<AttendanceRecord, unknown>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "timeIn",
      header: "Time In",
      cell: ({ row }) => formatTime(row.original.timeIn),
    },
    {
      accessorKey: "timeOut",
      header: "Time Out",
      cell: ({ row }) => formatTime(row.original.timeOut),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={attendance.slice(0, 5)}
      enableSearch={false}
      enablePagination={false}
      emptyTitle="No attendance records"
      emptyDescription="Recent attendance will appear here."
    />
  );
}
