import { getTodayAttendance } from "@/actions/attendance.actions";
import { getMembers } from "@/actions/member.actions";
import {
  getPayments,
  getPendingFeesSummary,
} from "@/actions/payment.actions";
import {
  AdminDashboardContent,
  type DashboardAttendanceItem,
} from "@/components/dashboard/AdminDashboardContent";
import type { PendingFeeItem } from "@/components/dashboard/PendingFeesCard";
import type { RecentPaymentItem } from "@/components/dashboard/RecentPaymentsCard";
import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/components/members/member-utils";

type PopulatedMember = {
  _id?: string;
  name?: string;
};

function getMember(value: unknown): PopulatedMember {
  return typeof value === "object" && value !== null
    ? (value as PopulatedMember)
    : {};
}

function currentDateLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function AdminDashboardPage() {
  const [membersResponse, attendanceResponse, pendingResponse, paymentsResponse] =
    await Promise.all([
      getMembers(),
      getTodayAttendance(),
      getPendingFeesSummary(),
      getPayments(),
    ]);
  const members = membersResponse.data ?? [];
  const todayAttendance = attendanceResponse.data?.attendance ?? [];
  const pendingItems = pendingResponse.data?.items ?? [];
  const recentPayments = paymentsResponse.data ?? [];
  const pendingFees: PendingFeeItem[] = pendingItems.slice(0, 5).map((item) => {
    const member = getMember(item.member);

    return {
      id: String(member._id ?? ""),
      name: member.name ?? "Member",
      pendingMonths: item.pendingMonths,
      amountDue: formatCurrency(item.outstandingAmount),
      href: `/admin/members/${member._id ?? ""}`,
    };
  });
  const paymentItems: RecentPaymentItem[] = recentPayments
    .slice(0, 5)
    .map((payment) => {
      const member = getMember(payment.memberId);

      return {
        id: payment._id,
        name: member.name ?? "Member",
        paymentType: payment.paymentType,
        amount: formatCurrency(payment.amount),
        paymentMode: payment.paymentMode,
        paymentDate: formatDate(payment.paymentDate),
      };
    });
  const attendanceItems: DashboardAttendanceItem[] = todayAttendance
    .slice(0, 5)
    .map((record) => {
      const member = getMember(record.memberId);

      return {
        id: record._id,
        name: member.name ?? "Member",
        timeIn: formatTime(record.timeIn),
        timeOut: formatTime(record.timeOut),
        status: record.timeOut ? "Checked Out" : "Checked In",
      };
    });

  return (
    <AdminDashboardContent
      stats={{
        totalMembers: members.length,
        activeMembers: members.filter((member) => member.isActive).length,
        todayAttendance: attendanceResponse.data?.presentCount ?? 0,
      }}
      pendingFees={pendingFees}
      recentPayments={paymentItems}
      todayAttendance={attendanceItems}
      currentDate={currentDateLabel()}
    />
  );
}
