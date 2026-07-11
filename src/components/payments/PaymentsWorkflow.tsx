"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, CreditCard, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { MemberData } from "@/actions/member.actions";
import {
  deletePayment,
  recordPayment,
  updatePayment,
  type PaymentData,
  type PaymentMode,
  type PaymentType,
} from "@/actions/payment.actions";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculatePendingMonths,
  formatCurrency,
  formatDate,
  monthKey,
} from "@/components/members/member-utils";

type MemberSummary = {
  _id?: string;
  name?: string;
  mobileNumber?: string;
  category?: string;
};

type PaymentRow = PaymentData & {
  member: MemberSummary;
};

export type PaymentFilters = {
  search: string;
  paymentType: string;
  paymentMode: string;
  paidForDate: string;
  paymentDate: string;
  member: string;
};

export interface PaymentsWorkflowProps {
  payments: PaymentData[];
  allPayments: PaymentData[];
  members: MemberData[];
  filters: PaymentFilters;
  yearOptions: number[];
}

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DEFAULT_PAYMENT_TYPE: PaymentType = "Monthly";
const PAYMENT_TYPE_FILTER = "Payment Type";
const PAYMENT_MODE_FILTER = "Payment Mode";
const filterPlaceholders = new Set([
  PAYMENT_TYPE_FILTER,
  PAYMENT_MODE_FILTER,
]);

function getMember(value: PaymentData["memberId"]): MemberSummary {
  return typeof value === "object" && value !== null ? value : {};
}

function getPaymentForMonth(payment: PaymentData) {
  return payment.paymentForMonth ?? payment.paymentMonth;
}

function getPaymentForYear(payment: PaymentData) {
  return payment.paymentForYear ?? payment.paymentYear;
}

function parseDate(value: string) {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function monthKeyFromDate(date: Date) {
  return dateKey(date).slice(0, 7);
}

function formatCalendarDate(value: string) {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Select Date";
}

function formatCalendarMonth(value: string) {
  const date = value ? parseDate(`${value}-01`) : undefined;
  return date
    ? date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Paid For";
}

function dateInputValue(value: string | Date = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function getDefaultAmount(member: MemberData | undefined, type: PaymentType) {
  if (!member) {
    return type === "Admission" ? 1200 : 0;
  }

  return type === "Admission" ? member.admissionFee : member.monthlyFee;
}

function getMemberPaymentKeys(payments: PaymentData[], memberId: string) {
  return new Set(
    payments
      .filter((payment) => {
        const paymentMemberId =
          typeof payment.memberId === "string"
            ? payment.memberId
            : String(payment.memberId._id ?? "");

        return paymentMemberId === memberId && payment.paymentType === "Monthly";
      })
      .map((payment) => {
        const month = getPaymentForMonth(payment);
        const year = getPaymentForYear(payment);

        return month && year ? monthKey(month, year) : "";
      })
      .filter(Boolean)
  );
}

function getPaidForLabel(payment: PaymentData) {
  if (payment.paymentType === "Admission") {
    return "-";
  }

  const month = getPaymentForMonth(payment);
  const year = getPaymentForYear(payment);

  if (!month || !year) {
    return "-";
  }

  return `${months[month - 1]?.label ?? "Month"} ${year}`;
}

function SelectField({
  value,
  onChange,
  children,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={`h-10 rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000] ${className ?? ""}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[var(--anchor-width)] p-1"
      >
        {children}
      </SelectContent>
    </Select>
  );
}

export function PaymentsWorkflow({
  payments,
  allPayments,
  members,
  filters,
  yearOptions,
}: PaymentsWorkflowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<PaymentRow | null>(null);
  const [editPayment, setEditPayment] = useState<PaymentRow | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(filters.member);
  const [paymentType, setPaymentType] =
    useState<PaymentType>(DEFAULT_PAYMENT_TYPE);
  const [amount, setAmount] = useState(() =>
    String(
      getDefaultAmount(
        members.find((member) => member._id === filters.member),
        DEFAULT_PAYMENT_TYPE
      )
    )
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [paymentDate, setPaymentDate] = useState(dateInputValue());
  const [paymentForMonth, setPaymentForMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [paymentForYear, setPaymentForYear] = useState(() =>
    new Date().getFullYear()
  );
  const [remarks, setRemarks] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState<PaymentMode>("Cash");
  const [editDate, setEditDate] = useState(dateInputValue());
  const [editForMonth, setEditForMonth] = useState(
    String(new Date().getMonth() + 1)
  );
  const [editForYear, setEditForYear] = useState(String(new Date().getFullYear()));
  const [editRemarks, setEditRemarks] = useState("");

  const rows = useMemo<PaymentRow[]>(
    () =>
      payments.map((payment) => ({
        ...payment,
        member: getMember(payment.memberId),
      })),
    [payments]
  );
  const selectedMember = members.find((member) => member._id === selectedMemberId);
 
  const selectedPaymentKeys = selectedMember
    ? getMemberPaymentKeys(allPayments, selectedMember._id)
    : new Set<string>();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthPaid = selectedPaymentKeys.has(
    monthKey(currentMonth, currentYear)
  );
  const pendingMonths = selectedMember
    ? calculatePendingMonths({
        joinDate: selectedMember.joinDate,
        paidMonths: selectedPaymentKeys,
        targetMonth: currentMonth,
        targetYear: currentYear,
      })
    : 0;

const outstandingAmount = selectedMember
  ? (selectedMember.admissionFeePaid ? 0 : selectedMember.admissionFee) +
    pendingMonths * selectedMember.monthlyFee
  : 0;
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      updateQuery("search", search);
    }, 350);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns: ColumnDef<PaymentRow, unknown>[] = [
      {
        accessorKey: "member.name",
        header: "Member Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#3F0000]">
            {row.original.member.name ?? "Member"}
          </span>
        ),
      },
      {
        id: "paidFor",
        header: "Paid For",
        cell: ({ row }) => getPaidForLabel(row.original),
      },
      {
        accessorKey: "paymentType",
        header: "Payment Type",
        cell: ({ row }) => <StatusBadge variant={row.original.paymentType} />,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-semibold text-[#3F7D58]">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "paymentMode",
        header: "Payment Mode",
        cell: ({ row }) => <StatusBadge variant={row.original.paymentMode} />,
      },
      {
        accessorKey: "paymentDate",
        header: "Payment Date",
        cell: ({ row }) => formatDate(row.original.paymentDate),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewPayment(row.original)}
              className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
            >
              <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" />
              View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEditDialog(row.original)}
              className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
            >
              <Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Edit
            </Button>
            <ConfirmDeleteDialog
              title="Delete payment?"
              description={`Delete ${row.original.paymentType.toLowerCase()} payment for ${
                row.original.member.name ?? "this member"
              }.`}
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
              onConfirm={() => handleDelete(row.original)}
            />
          </div>
        ),
      },
    ];

  function updateQuery(key: keyof PaymentFilters, value: string) {
    if (!pathname) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const paramKeyMap: Record<keyof PaymentFilters, string> = {
      search: "search",
      paymentType: "type",
      paymentMode: "mode",
      paidForDate: "paidFor",
      paymentDate: "paymentDate",
      member: "member",
    };
    const paramKey = paramKeyMap[key];
    const shouldDelete =
      filterPlaceholders.has(value) ||
      (key === "search" || key === "paidForDate" || key === "paymentDate") &&
        value.trim() === "";

    if (shouldDelete) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, key === "search" ? value.trim() : value);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function resetFilters() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  function resetRecordForm() {
    setSelectedMemberId(filters.member);
    setMemberSearch("");
    setPaymentType(DEFAULT_PAYMENT_TYPE);
    setAmount(
      String(
        getDefaultAmount(
          members.find((member) => member._id === filters.member),
          DEFAULT_PAYMENT_TYPE
        )
      )
    );
    setPaymentMode("Cash");
    setPaymentDate(dateInputValue());
    setPaymentForMonth(new Date().getMonth() + 1);
    setPaymentForYear(new Date().getFullYear());
    setRemarks("");
  }

  function handleRecordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMemberId) {
      toast.error("Please select a member.");
      return;
    }

    const parsedAmount = Number(amount);
    if (
      paymentType === "Monthly" &&
      (!Number.isInteger(paymentForMonth) ||
        paymentForMonth < 1 ||
        paymentForMonth > 12 ||
        !Number.isInteger(paymentForYear))
    ) {
      toast.error("Please select a valid payment month and year.");
      return;
    }

    startTransition(async () => {
      const response = await recordPayment({
        memberId: selectedMemberId,
        paymentType,
        amount: parsedAmount,
        paymentMode,
        paymentDate,
        paymentForMonth:
          paymentType === "Monthly" ? paymentForMonth : undefined,
        paymentForYear: paymentType === "Monthly" ? paymentForYear : undefined,
        remarks,
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
      setRecordOpen(false);
      resetRecordForm();
      router.refresh();
    });
  }

  function handleSelectMember(memberId: string) {
    const member = members.find((item) => item._id === memberId);
    setSelectedMemberId(memberId);
    setAmount(String(getDefaultAmount(member, paymentType)));
  }

  function handlePaymentTypeChange(nextType: PaymentType) {
    const member = members.find((item) => item._id === selectedMemberId);
    setPaymentType(nextType);
    setAmount(String(getDefaultAmount(member, nextType)));
  }

  function openRecordDialog() {
    resetRecordForm();
    setRecordOpen(true);
  }

  function openEditDialog(payment: PaymentRow) {
    setEditPayment(payment);
    setEditAmount(String(payment.amount));
    setEditMode(payment.paymentMode);
    setEditDate(dateInputValue(payment.paymentDate));
    setEditForMonth(String(getPaymentForMonth(payment) ?? currentMonth));
    setEditForYear(String(getPaymentForYear(payment) ?? currentYear));
    setEditRemarks(payment.remarks ?? "");
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editPayment) {
      return;
    }

    startTransition(async () => {
      const response = await updatePayment(editPayment._id, {
        amount: Number(editAmount),
        paymentMode: editMode,
        paymentDate: editDate,
        paymentForMonth:
          editPayment.paymentType === "Monthly"
            ? Number(editForMonth)
            : undefined,
        paymentForYear:
          editPayment.paymentType === "Monthly" ? Number(editForYear) : undefined,
        remarks: editRemarks,
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
      setEditPayment(null);
      router.refresh();
    });
  }

  function handleDelete(payment: PaymentRow) {
    startTransition(async () => {
      const response = await deletePayment(payment._id);

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Record and manage all gym payments."
        action={
          <Button
            type="button"
            onClick={openRecordDialog}
            className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
          >
            <CreditCard className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Record Payment
          </Button>
        }
      />

      <SectionCard title="Payment Records">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(130px,1fr))_auto]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search member by name..."
          />
          <SelectField
            value={filters.paymentType}
            onChange={(value) => updateQuery("paymentType", value)}
            ariaLabel="Filter by payment type"
          >
            {[PAYMENT_TYPE_FILTER, "Admission", "Monthly"].map((item) => (
              <SelectItem key={item} value={item} className="rounded-lg text-[#3F0000]">
                {item}
              </SelectItem>
            ))}
          </SelectField>
          <SelectField
            value={filters.paymentMode}
            onChange={(value) => updateQuery("paymentMode", value)}
            ariaLabel="Filter by payment mode"
          >
            {[PAYMENT_MODE_FILTER, "Cash", "UPI"].map((item) => (
              <SelectItem key={item} value={item} className="rounded-lg text-[#3F0000]">
                {item}
              </SelectItem>
            ))}
          </SelectField>
          <DateFilter
            label="Paid For"
            onSelect={(date) => updateQuery("paidForDate", monthKeyFromDate(date))}
            displayValue={formatCalendarMonth(filters.paidForDate)}
            selectedDate={filters.paidForDate ? parseDate(`${filters.paidForDate}-01`) : undefined}
          />
          <DateFilter
            label="Payment Date"
            onSelect={(date) => updateQuery("paymentDate", dateKey(date))}
            displayValue={formatCalendarDate(filters.paymentDate)}
            selectedDate={parseDate(filters.paymentDate)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
          >
            <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Reset
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Record a payment or adjust the filters."
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            enableSearch={false}
            initialPageSize={15}
            emptyTitle="No payments found"
            emptyDescription="Record a payment or adjust the filters."
          />
        )}
      </SectionCard>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#FFAA83] bg-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Select a member and record an admission or monthly payment.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRecordSubmit}>
            <MemberSelector
              memberSearch={memberSearch}
              setMemberSearch={setMemberSearch}
              selectedMemberId={selectedMemberId}
              setSelectedMemberId={handleSelectMember}
              members={filteredMembers}
            />

            {selectedMember ? (
              <MemberPaymentSummary
                member={selectedMember}
                currentMonthPaid={currentMonthPaid}
                pendingMonths={pendingMonths}
                outstandingAmount={outstandingAmount}
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Label text="Payment Type">
                <SelectField
                  value={paymentType}
                  onChange={(value) => handlePaymentTypeChange(value as PaymentType)}
                  ariaLabel="Payment type"
                  className="w-full"
                >
                  <SelectItem value="Admission" className="rounded-lg text-[#3F0000]">
                    Admission
                  </SelectItem>
                  <SelectItem value="Monthly" className="rounded-lg text-[#3F0000]">
                    Monthly
                  </SelectItem>
                </SelectField>
              </Label>
              <Label text="Amount">
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-10 rounded-xl border-[#FFAA83] bg-white"
                />
              </Label>
              {paymentType === "Monthly" ? (
                <>
                  <Label text="Payment For Month">
                    <SelectField
                      value={String(paymentForMonth)}
                      onChange={(value) => setPaymentForMonth(Number(value))}
                      ariaLabel="Payment for month"
                      className="w-full"
                    >
                      {months.map((month) => (
                        <SelectItem
                          key={month.value}
                          value={month.value}
                          className="rounded-lg text-[#3F0000]"
                        >
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectField>
                  </Label>
                  <Label text="Payment For Year">
                    <SelectField
                      value={String(paymentForYear)}
                      onChange={(value) => setPaymentForYear(Number(value))}
                      ariaLabel="Payment for year"
                      className="w-full"
                    >
                      {yearOptionsWithNext(yearOptions).map((year) => (
                        <SelectItem
                          key={year}
                          value={String(year)}
                          className="rounded-lg text-[#3F0000]"
                        >
                          {year}
                        </SelectItem>
                      ))}
                    </SelectField>
                  </Label>
                </>
              ) : null}
              <Label text="Payment Date">
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="h-10 rounded-xl border-[#FFAA83] bg-white"
                />
              </Label>
              <Label text="Payment Mode">
                <SelectField
                  value={paymentMode}
                  onChange={(value) => setPaymentMode(value as PaymentMode)}
                  ariaLabel="Payment mode"
                  className="w-full"
                >
                  <SelectItem value="Cash" className="rounded-lg text-[#3F0000]">
                    Cash
                  </SelectItem>
                  <SelectItem value="UPI" className="rounded-lg text-[#3F0000]">
                    UPI
                  </SelectItem>
                </SelectField>
              </Label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[14px] font-semibold text-[#3F0000]">
                  Notes
                </span>
                <Input
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Optional notes"
                  className="h-10 rounded-xl border-[#FFAA83] bg-white"
                />
              </label>
            </div>

            <DialogFooter className="border-[#FFAA83] bg-[#FFEADE]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRecordOpen(false)}
                className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
              >
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewPayment)} onOpenChange={(open) => !open && setViewPayment(null)}>
        <DialogContent className="rounded-[20px] border border-[#FFAA83] bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
              Payment Details
            </DialogTitle>
            <DialogDescription>Complete payment information.</DialogDescription>
          </DialogHeader>
          {viewPayment ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Member" value={viewPayment.member.name ?? "Member"} />
              <Info label="Category" value={viewPayment.member.category ?? "-"} />
              <Info label="Payment Type" value={viewPayment.paymentType} />
              <Info label="Amount" value={formatCurrency(viewPayment.amount)} />
              <Info label="Payment Mode" value={viewPayment.paymentMode} />
              <Info label="Payment Date" value={formatDate(viewPayment.paymentDate)} />
              <Info label="Paid For" value={getPaidForLabel(viewPayment)} />
              <Info label="Created At" value={formatDate(viewPayment.createdAt)} />
              <div className="sm:col-span-2">
                <Info label="Notes" value={viewPayment.remarks || "No notes added."} />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editPayment)} onOpenChange={(open) => !open && setEditPayment(null)}>
        <DialogContent className="rounded-[20px] border border-[#FFAA83] bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
              Edit Payment
            </DialogTitle>
            <DialogDescription>
              Update payment details. Payment type cannot be changed.
            </DialogDescription>
          </DialogHeader>

          {editPayment ? (
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="rounded-[18px] border border-[#FFAA83] bg-[#FFEADE]/40 p-3 text-[14px] text-[#3F0000]">
                <span className="font-semibold">Payment Type:</span>{" "}
                {editPayment.paymentType}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Label text="Amount">
                  <Input
                    type="number"
                    min="0"
                    value={editAmount}
                    onChange={(event) => setEditAmount(event.target.value)}
                    className="h-10 rounded-xl border-[#FFAA83] bg-white"
                  />
                </Label>
                <Label text="Payment Mode">
                  <SelectField
                    value={editMode}
                    onChange={(value) => setEditMode(value as PaymentMode)}
                    ariaLabel="Edit payment mode"
                    className="w-full"
                  >
                    <SelectItem value="Cash" className="rounded-lg text-[#3F0000]">
                      Cash
                    </SelectItem>
                    <SelectItem value="UPI" className="rounded-lg text-[#3F0000]">
                      UPI
                    </SelectItem>
                  </SelectField>
                </Label>
                <Label text="Payment Date">
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(event) => setEditDate(event.target.value)}
                    className="h-10 rounded-xl border-[#FFAA83] bg-white"
                  />
                </Label>
                {editPayment.paymentType === "Monthly" ? (
                  <>
                    <Label text="Payment For Month">
                      <SelectField
                        value={editForMonth}
                        onChange={setEditForMonth}
                        ariaLabel="Edit payment for month"
                        className="w-full"
                      >
                        {months.map((month) => (
                          <SelectItem
                            key={month.value}
                            value={month.value}
                            className="rounded-lg text-[#3F0000]"
                          >
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectField>
                    </Label>
                    <Label text="Payment For Year">
                      <SelectField
                        value={editForYear}
                        onChange={setEditForYear}
                        ariaLabel="Edit payment for year"
                        className="w-full"
                      >
                        {yearOptionsWithNext(yearOptions).map((year) => (
                          <SelectItem
                            key={year}
                            value={String(year)}
                            className="rounded-lg text-[#3F0000]"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectField>
                    </Label>
                  </>
                ) : null}
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-[14px] font-semibold text-[#3F0000]">
                    Notes
                  </span>
                  <Input
                    value={editRemarks}
                    onChange={(event) => setEditRemarks(event.target.value)}
                    placeholder="Optional notes"
                    className="h-10 rounded-xl border-[#FFAA83] bg-white"
                  />
                </label>
              </div>

              <DialogFooter className="border-[#FFAA83] bg-[#FFEADE]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPayment(null)}
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
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[14px] font-semibold text-[#3F0000]">{text}</span>
      {children}
    </label>
  );
}

function DateFilter({
  label,
  selectedDate,
  onSelect,
  displayValue,
}: {
  label: string;
  selectedDate?: Date;
  onSelect: (date: Date) => void;
  displayValue: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-between rounded-xl border-[#FFAA83] bg-white px-3 text-[14px] font-medium text-[#3F0000] hover:bg-[#FFEADE]"
            aria-label={`${label}: ${displayValue}`}
          />
        }
      >
        <span className={selectedDate ? "" : "text-[#737373]"}>{displayValue}</span>
        <CalendarDays className="size-4 text-[#9A3412]" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onSelect(date);
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#FFAA83] bg-white p-3">
      <p className="text-[13px] font-medium text-[#737373]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[#3F0000]">{value}</p>
    </div>
  );
}

function MemberSelector({
  memberSearch,
  setMemberSearch,
  selectedMemberId,
  setSelectedMemberId,
  members,
}: {
  memberSearch: string;
  setMemberSearch: (value: string) => void;
  selectedMemberId: string;
  setSelectedMemberId: (value: string) => void;
  members: MemberData[];
}) {
  return (
    <div className="space-y-2">
      <span className="text-[14px] font-semibold text-[#3F0000]">Member</span>
      <SearchInput
        value={memberSearch}
        onChange={setMemberSearch}
        placeholder="Search member..."
      />
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[#FFAA83] bg-white p-2">
        {members.map((member) => (
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
            <span className="text-[12px] opacity-80">{member.mobileNumber}</span>
          </button>
        ))}
        {members.length === 0 ? (
          <p className="px-3 py-2 text-[14px] text-[#737373]">
            No members found.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MemberPaymentSummary({
  member,
  currentMonthPaid,
  pendingMonths,
  outstandingAmount,
}: {
  member: MemberData;
  currentMonthPaid: boolean;
  pendingMonths: number;
  outstandingAmount: number;
}) {
     console.log({
  admissionFee: member.admissionFee,
  admissionFeePaid: member.admissionFeePaid,
  pendingMonths,
  outstandingAmount,
});
  return (
 
    <div className="grid gap-3 rounded-[18px] border border-[#FFAA83] bg-[#FFEADE]/40 p-3 sm:grid-cols-2">
      <Info label="Member" value={member.name} />
      <Info label="Category" value={member.category} />
      <Info
        label="Admission Fee"
        value={member.admissionFeePaid ? "Paid" : "Pending"}
      />
      <Info
        label="Current Month"
        value={currentMonthPaid ? "Paid" : "Pending"}
      />
      <Info label="Pending Months" value={pendingMonths} />
      <Info label="Outstanding Amount" value={formatCurrency(outstandingAmount)} />
    </div>
  );
}

function yearOptionsWithNext(yearOptions: number[]) {
  const nextYear = new Date().getFullYear() + 1;
  return Array.from(new Set([nextYear, ...yearOptions])).sort((a, b) => b - a);
}
