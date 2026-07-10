"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { MemberData } from "@/actions/member.actions";
import {
  recordPayment,
  type PaymentData,
  type PaymentMode,
  type PaymentType,
} from "@/actions/payment.actions";
import { SearchInput } from "@/components/common/SearchInput";
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
  monthKey,
} from "@/components/members/member-utils";

export type RecordPaymentInitialValues = {
  memberId?: string;
  paymentType?: PaymentType;
  paymentForMonth?: number;
  paymentForYear?: number;
};

export interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberData[];
  allPayments: PaymentData[];
  yearOptions: number[];
  initialValues?: RecordPaymentInitialValues;
  onSuccess?: () => void;
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

function dateInputValue(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function getDefaultAmount(member: MemberData | undefined, type: PaymentType) {
  if (!member) return type === "Admission" ? 1200 : 0;
  return type === "Admission" ? member.admissionFee : member.monthlyFee;
}

function getPaymentForMonth(payment: PaymentData) {
  return payment.paymentForMonth ?? payment.paymentMonth;
}

function getPaymentForYear(payment: PaymentData) {
  return payment.paymentForYear ?? payment.paymentYear;
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

function yearOptionsWithNext(yearOptions: number[]) {
  const nextYear = new Date().getFullYear() + 1;
  return Array.from(new Set([nextYear, ...yearOptions])).sort((a, b) => b - a);
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  members,
  allPayments,
  yearOptions,
  initialValues,
  onSuccess,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultType = initialValues?.paymentType ?? "Monthly";
  const defaultMember = members.find(
    (member) => member._id === initialValues?.memberId
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(
    initialValues?.memberId ?? ""
  );
  const [paymentType, setPaymentType] = useState<PaymentType>(defaultType);
  const [amount, setAmount] = useState(
    String(getDefaultAmount(defaultMember, defaultType))
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [paymentDate, setPaymentDate] = useState(dateInputValue());
  const [paymentForMonth, setPaymentForMonth] = useState(
    initialValues?.paymentForMonth ?? new Date().getMonth() + 1
  );
  const [paymentForYear, setPaymentForYear] = useState(
    initialValues?.paymentForYear ?? new Date().getFullYear()
  );
  const [remarks, setRemarks] = useState("");
  const selectedMember = members.find((member) => member._id === selectedMemberId);
  const paidMonths = selectedMember
    ? getMemberPaymentKeys(allPayments, selectedMember._id)
    : new Set<string>();
  const now = new Date();
  const pendingMonths = selectedMember
    ? calculatePendingMonths({
        joinDate: selectedMember.joinDate,
        paidMonths,
        targetMonth: now.getMonth() + 1,
        targetYear: now.getFullYear(),
      })
    : 0;
  const outstandingAmount = selectedMember
    ? pendingMonths * selectedMember.monthlyFee
    : 0;
  const filteredMembers = members.filter((member) => {
    const query = memberSearch.trim().toLowerCase();
    return (
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.mobileNumber.toLowerCase().includes(query)
    );
  });

  function selectMember(memberId: string) {
    const member = members.find((item) => item._id === memberId);
    setSelectedMemberId(memberId);
    setAmount(String(getDefaultAmount(member, paymentType)));
  }

  function changeType(nextType: PaymentType) {
    const member = members.find((item) => item._id === selectedMemberId);
    setPaymentType(nextType);
    setAmount(String(getDefaultAmount(member, nextType)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMemberId) {
      toast.error("Please select a member.");
      return;
    }

    startTransition(async () => {
      const response = await recordPayment({
        memberId: selectedMemberId,
        paymentType,
        amount: Number(amount),
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
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[20px] border border-[#FFAA83] bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold text-[#3F0000]">
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Select a member and record an admission or monthly payment.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <span className="text-[14px] font-semibold text-[#3F0000]">Member</span>
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
                  onClick={() => selectMember(member._id)}
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
            </div>
          </div>

          {selectedMember ? (
            <div className="grid gap-3 rounded-[18px] border border-[#FFAA83] bg-[#FFEADE]/40 p-3 sm:grid-cols-2">
              <Info label="Member" value={selectedMember.name} />
              <Info label="Category" value={selectedMember.category} />
              <Info
                label="Admission Fee"
                value={selectedMember.admissionFeePaid ? "Paid" : "Pending"}
              />
              <Info label="Pending Months" value={pendingMonths} />
              <Info
                label="Outstanding Amount"
                value={formatCurrency(outstandingAmount)}
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Label text="Payment Type">
              <SelectField
                value={paymentType}
                onChange={(value) => changeType(value as PaymentType)}
                ariaLabel="Payment type"
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
              <span className="text-[14px] font-semibold text-[#3F0000]">Notes</span>
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
              onClick={() => onOpenChange(false)}
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
  );
}

function SelectField({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-10 w-full rounded-xl border-[#FFAA83] bg-white text-[14px] font-semibold text-[#3F0000]"
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

function Label({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[14px] font-semibold text-[#3F0000]">{text}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#FFAA83] bg-white p-3">
      <p className="text-[13px] font-medium text-[#737373]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[#3F0000]">{value}</p>
    </div>
  );
}
