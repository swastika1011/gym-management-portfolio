import type {
  AttendanceHistoryData,
  PaymentHistoryData,
} from "@/actions/member.actions";

export type PaymentRecord = PaymentHistoryData & {
  paymentType?: "Admission" | "Monthly";
  amount?: number;
  paymentForMonth?: number;
  paymentForYear?: number;
  paymentMonth?: number;
  paymentYear?: number;
  paymentDate?: string;
  paymentMode?: "Cash" | "UPI";
};

export type AttendanceRecord = AttendanceHistoryData & {
  _id?: string;
  date?: string;
  timeIn?: string;
  timeOut?: string | null;
};

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthKey(month: number, year: number) {
  return `${year}-${month}`;
}

export function getMonthlyPaymentKeys(payments: PaymentRecord[]) {
  return new Set(
    payments
      .filter(
        (payment) =>
          payment.paymentType === "Monthly" &&
          (payment.paymentForMonth ?? payment.paymentMonth) &&
          (payment.paymentForYear ?? payment.paymentYear)
      )
      .map((payment) =>
        monthKey(
          (payment.paymentForMonth ?? payment.paymentMonth)!,
          (payment.paymentForYear ?? payment.paymentYear)!
        )
      )
  );
}

export function getAdmissionPayment(payments: PaymentRecord[]) {
  return payments.find((payment) => payment.paymentType === "Admission");
}

export function calculatePendingMonths(params: {
  joinDate: string;
  paidMonths: Set<string>;
  targetMonth: number;
  targetYear: number;
}) {
  const joinedAt = new Date(params.joinDate);
  const startIndex = joinedAt.getFullYear() * 12 + joinedAt.getMonth();
  const targetIndex = params.targetYear * 12 + params.targetMonth - 1;
  let pending = 0;

  for (let index = startIndex; index <= targetIndex; index += 1) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;

    if (!params.paidMonths.has(monthKey(month, year))) {
      pending += 1;
    }
  }

  return Math.max(pending, 0);
}
