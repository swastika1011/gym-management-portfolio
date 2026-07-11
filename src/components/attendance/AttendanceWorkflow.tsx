"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  checkoutAttendance,
  deleteAttendance,
  markAttendance,
  updateAttendanceTimeOut,
  type AttendanceData,
} from "@/actions/attendance.actions";
import type { MemberData } from "@/actions/member.actions";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { SearchInput } from "@/components/common/SearchInput";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatTime } from "@/components/members/member-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AttendanceMember = {
  _id?: string;
  name?: string;
  mobileNumber?: string;
};

type AttendanceRow = AttendanceData & {
  member: AttendanceMember;
};

export interface AttendanceWorkflowProps {
  attendance: AttendanceData[];
  members: MemberData[];
  selectedDate: string;
  selectedYear: number;
  years: number[];
}

function dateInputValue(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function timeInputValue(value = new Date()) {
  return value.toTimeString().slice(0, 5);
}

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}`);
}

function getMember(value: AttendanceData["memberId"]): AttendanceMember {
  return typeof value === "object" && value !== null ? value : {};
}

export function AttendanceWorkflow({
  attendance,
  members,
  selectedDate,
  selectedYear,
  years,
}: AttendanceWorkflowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [markOpen, setMarkOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRow | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(dateInputValue());
  const [timeIn, setTimeIn] = useState(timeInputValue());
  const [timeOut, setTimeOut] = useState(timeInputValue());
  const [isPending, startTransition] = useTransition();

  const rows = useMemo<AttendanceRow[]>(
    () =>
      attendance.map((record) => ({
        ...record,
        member: getMember(record.memberId),
      })),
    [attendance]
  );

  const filteredMembers = members.filter((member) => {
    const query = memberSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      member.name.toLowerCase().includes(query) ||
      member.mobileNumber.toLowerCase().includes(query)
    );
  });

  const columns = useMemo<ColumnDef<AttendanceRow, unknown>[]>(
    () => [
      {
        accessorKey: "member.name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#3F0000]">
            {row.original.member.name ?? "Member"}
          </span>
        ),
      },
      {
        accessorKey: "member.mobileNumber",
        header: "Mobile Number",
        cell: ({ row }) => row.original.member.mobileNumber ?? "-",
      },
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
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            variant="Active"
            label={row.original.timeOut ? "Checked Out" : "Checked In"}
            className={
              row.original.timeOut
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : undefined
            }
          />
        ),
      },
    ],
    []
  );

  function updateAttendanceFilter(key: "date" | "year", value: string | null) {
    if (!pathname || value === null) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (key === "date") {
      if (value) {
        params.set("date", value);
        params.set("year", String(new Date(`${value}T00:00:00`).getFullYear()));
      } else {
        params.delete("date");
      }
    } else {
      params.set("year", value);
      params.delete("date");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function resetMarkForm() {
    setSelectedMemberId("");
    setMemberSearch("");
    setAttendanceDate(dateInputValue());
    setTimeIn(timeInputValue());
  }

  function handleMarkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMemberId) {
      toast.error("Please select a member.");
      return;
    }

    startTransition(async () => {
      const response = await markAttendance({
        memberId: selectedMemberId,
        date: attendanceDate,
        timeIn: combineDateAndTime(attendanceDate, timeIn),
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success("Attendance saved.");
      setMarkOpen(false);
      resetMarkForm();
      window.location.reload();
    });
  }

  function handleCheckout(record: AttendanceRow) {
    startTransition(async () => {
      const response = await checkoutAttendance(record._id);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success("Checkout recorded.");
      window.location.reload();
    });
  }

  function handleEditTimeOutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editRecord) {
      return;
    }

    startTransition(async () => {
      const date = dateInputValue(new Date(editRecord.date));
      const response = await updateAttendanceTimeOut(editRecord._id, {
        timeOut: combineDateAndTime(date, timeOut),
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success("Checkout time updated.");
      setEditRecord(null);
      window.location.reload();
    });
  }

  function handleDelete(record: AttendanceRow) {
    startTransition(async () => {
      const response = await deleteAttendance(record._id);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success("Attendance deleted.");
      window.location.reload();
    });
  }

  return (
    <>
      <SectionCard
        title="Attendance Records"
        description="Mark attendance, check out members, and manage daily records."
        headerAction={
          <div className="flex flex-wrap justify-end gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                updateAttendanceFilter("date", event.target.value)
              }
              className="h-9 w-40 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]"
              aria-label="Filter attendance by date"
            />
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => updateAttendanceFilter("year", value)}
            >
              <SelectTrigger className="h-9 w-28 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="end"
                alignItemWithTrigger={false}
                className="!min-w-0 w-[var(--anchor-width)] p-1"
              >
                {years.map((year) => (
                  <SelectItem
                    key={year}
                    value={String(year)}
                    className="rounded-lg px-2 py-1 text-[#3F0000] focus:bg-transparent data-[highlighted]:bg-transparent"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => setMarkOpen(true)}
              className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
            >
              <CalendarCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Mark Attendance
            </Button>
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            title="No attendance records"
            description="Use Mark Attendance to create the first record."
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            searchPlaceholder="Search attendance..."
            initialPageSize={15}
            emptyTitle="No attendance records found"
            emptyDescription="Try another search term."
            rowActions={({ original }) => (
              <>
                {original.timeOut ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditRecord(original);
                      setTimeOut(timeInputValue(new Date(original.timeOut!)));
                    }}
                    className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
                  >
                    <Clock className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    Edit Time Out
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleCheckout(original)}
                    className="rounded-xl bg-[#3F7D58] text-[14px] font-semibold text-white hover:bg-[#34694a]"
                  >
                    Check Out
                  </Button>
                )}
                <ConfirmDeleteDialog
                  title="Delete attendance?"
                  description={`Delete attendance for ${
                    original.member.name ?? "this member"
                  } on ${formatDate(original.date)}.`}
                  confirmText="Delete"
                  cancelText="Cancel"
                  trigger={
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-xl text-[14px] font-semibold"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                      Delete
                    </Button>
                  }
                  onConfirm={() => handleDelete(original)}
                />
              </>
            )}
          />
        )}
      </SectionCard>

      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="rounded-[20px] border border-[#FFAA83] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
              Mark Attendance
            </DialogTitle>
            <DialogDescription>
              Select a member and set the check-in date and time.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleMarkSubmit}>
            <div className="space-y-2">
              <span className="text-[14px] font-semibold text-[#3F0000]">
                Member
              </span>
              <SearchInput
                value={memberSearch}
                onChange={setMemberSearch}
                placeholder="Search member..."
              />
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#FFAA83] bg-white p-2">
                {filteredMembers.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => setSelectedMemberId(member._id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition ${
                      selectedMemberId === member._id
                        ? "bg-[#9A3412] text-white"
                        : "text-[#3F0000] hover:bg-[#FFEADE]"
                    }`}
                  >
                    <span className="font-semibold">{member.name}</span>
                    <span className="text-[12px] opacity-80">
                      {member.mobileNumber}
                    </span>
                  </button>
                ))}
                {filteredMembers.length === 0 ? (
                  <p className="px-3 py-2 text-[14px] text-[#737373]">
                    No members found.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[14px] font-semibold text-[#3F0000]">
                  Date
                </span>
                <Input
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                  className="h-10 rounded-xl border-[#FFAA83] bg-white"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[14px] font-semibold text-[#3F0000]">
                  Time In
                </span>
                <Input
                  type="time"
                  value={timeIn}
                  onChange={(event) => setTimeIn(event.target.value)}
                  className="h-10 rounded-xl border-[#FFAA83] bg-white"
                />
              </label>
            </div>

            <DialogFooter className="border-[#FFAA83] bg-[#FFEADE]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMarkOpen(false)}
                className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
              >
                Save Attendance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRecord)} onOpenChange={(open) => !open && setEditRecord(null)}>
        <DialogContent className="rounded-[20px] border border-[#FFAA83] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
              Edit Time Out
            </DialogTitle>
            <DialogDescription>
              Update the checkout time for this attendance record.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditTimeOutSubmit}>
            <label className="space-y-1.5">
              <span className="text-[14px] font-semibold text-[#3F0000]">
                Time Out
              </span>
              <Input
                type="time"
                value={timeOut}
                onChange={(event) => setTimeOut(event.target.value)}
                className="h-10 rounded-xl border-[#FFAA83] bg-white"
              />
            </label>
            <DialogFooter className="border-[#FFAA83] bg-[#FFEADE]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRecord(null)}
                className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
