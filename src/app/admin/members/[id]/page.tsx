import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CreditCard, Pencil } from "lucide-react";

import { getMemberById } from "@/actions/member.actions";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AttendanceHeatmap } from "@/components/members/AttendanceHeatmap";
import { HeatmapYearSelect } from "@/components/members/HeatmapYearSelect";
import { MemberDeleteButton } from "@/components/members/MemberDeleteButton";
import { MonthPaymentChips } from "@/components/members/MonthPaymentChips";
import { RecentAttendanceTable } from "@/components/members/RecentAttendanceTable";
import {
  type AttendanceRecord,
  type PaymentRecord,
  calculatePendingMonths,
  formatCurrency,
  formatDate,
  getAdmissionPayment,
  getMonthlyPaymentKeys,
  monthKey,
} from "@/components/members/member-utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const now = new Date();
  const queryYear = Array.isArray(query.year) ? query.year[0] : query.year;
  const parsedYear = Number(queryYear);
  const selectedYear =
    Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 9999
      ? parsedYear
      : now.getFullYear();
  const response = await getMemberById(id, { attendanceYear: selectedYear });

  if (!response.data && response.message === "Member not found.") {
    notFound();
  }

  if (!response.success || !response.data) {
    return (
      <EmptyState
        title="Unable to load member profile"
        description={response.message}
      />
    );
  }

  const { member } = response.data;
  const payments = response.data.paymentHistory as PaymentRecord[];
  const attendance = response.data.attendanceHistory as AttendanceRecord[];
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const joinYear = new Date(member.joinDate).getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - joinYear + 1 },
    (_, index) => currentYear - index,
  );
  const paidMonths = getMonthlyPaymentKeys(payments);
  const admissionPayment = getAdmissionPayment(payments);
  const currentMonthPaid = paidMonths.has(monthKey(currentMonth, currentYear));
  const pendingMonths = calculatePendingMonths({
    joinDate: member.joinDate,
    paidMonths,
    targetMonth: currentMonth,
    targetYear: currentYear,
  });
  const outstandingAmount = pendingMonths * member.monthlyFee;

  return (
    <div className="space-y-4">
      <PageHeader
        title={member.name}
        description="Complete member profile, payments, and attendance overview."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              render={<Link href={`/admin/members/${member._id}/edit`} />}
              variant="outline"
              size="sm"
              className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
            >
              <Pencil
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Edit Member
            </Button>
            <MemberDeleteButton
              memberId={member._id}
              memberName={member.name}
              redirectTo="/admin/members"
            />
            <Button
              render={<Link href={`/admin/payments?member=${member._id}`} />}
              size="sm"
              className="rounded-xl bg-[#9A3412] text-[14px] font-semibold text-white hover:bg-[#7C2D12]"
            >
              <CreditCard
                className="size-4"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              Record Payment
            </Button>
          </div>
        }
      />

      <SectionCard title="Basic Information">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Name" value={member.name} />
          <InfoItem label="Mobile Number" value={member.mobileNumber} />
          <InfoItem label="Category" value={member.category} />
          <InfoItem label="Join Date" value={formatDate(member.joinDate)} />
          <InfoItem
            label="Status"
            value={
              <StatusBadge variant={member.isActive ? "Active" : "Inactive"} />
            }
          />
          <InfoItem
            label="Admission Fee Paid"
            value={
              <StatusBadge
                variant={member.admissionFeePaid ? "Paid" : "Pending"}
              />
            }
          />
          <div className="sm:col-span-2 xl:col-span-3">
            <InfoItem label="Notes" value={member.notes || "No notes added."} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payment Summary">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem
            label="Admission Fee"
            value={formatCurrency(member.admissionFee)}
            badge={
              <StatusBadge variant={admissionPayment ? "Paid" : "Pending"} />
            }
          />
          <SummaryItem
            label="Current Month Fee"
            value={formatCurrency(member.monthlyFee)}
            badge={
              <StatusBadge variant={currentMonthPaid ? "Paid" : "Pending"} />
            }
          />
          <SummaryItem label="Pending Months" value={pendingMonths} />
          <SummaryItem
            label="Outstanding Amount"
            value={formatCurrency(outstandingAmount)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Payment Status By Month"
        description={`Monthly fee status for ${currentYear}.`}
        headerAction={
          <HeatmapYearSelect selectedYear={currentYear} years={yearOptions} />
        }
      >
        <MonthPaymentChips year={currentYear} paidMonthKeys={paidMonths} />
      </SectionCard>

      <SectionCard title="Payment History">
        <Button
          render={<Link href={`/admin/payments?member=${member._id}`} />}
          variant="outline"
          className="rounded-xl border-[#FFAA83] text-[14px] font-semibold text-[#3F0000] hover:bg-[#FFEADE]"
        >
          View Complete Payment History
        </Button>
      </SectionCard>

      <SectionCard
        title="Attendance Heatmap"
        description={`Daily attendance activity for ${selectedYear}.`}
        headerAction={
          <HeatmapYearSelect selectedYear={selectedYear} years={yearOptions} />
        }
      >
        <AttendanceHeatmap attendance={attendance} year={selectedYear} />
      </SectionCard>

      <SectionCard title="Recent Attendance">
        <RecentAttendanceTable attendance={attendance} />
      </SectionCard>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[#FFAA83] bg-white p-4">
      <p className="text-[13px] font-medium text-[#737373]">{label}</p>
      <div className="mt-1 text-[15px] font-semibold text-[#3F0000]">
        {value}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  badge,
}: {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-[#FFAA83] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[#737373]">{label}</p>
        {badge}
      </div>
      <p className="mt-2 text-2xl font-bold text-[#3F0000]">{value}</p>
    </div>
  );
}
