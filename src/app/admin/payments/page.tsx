import { getMembers } from "@/actions/member.actions";
import {
  getPayments,
  type PaymentMode,
  type PaymentType,
} from "@/actions/payment.actions";
import {
  PaymentsWorkflow,
  type PaymentFilters,
} from "@/components/payments/PaymentsWorkflow";

const PAYMENT_TYPE_FILTER = "Payment Type";
const PAYMENT_MODE_FILTER = "Payment Mode";
const PAID_FOR_YEAR_FILTER = "Paid For Year";
const PAID_FOR_MONTH_FILTER = "Paid For Month";
const PAID_IN_MONTH_FILTER = "Paid In Month";
const PAID_IN_YEAR_FILTER = "Paid In Year";

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePaymentType(value?: string): PaymentFilters["paymentType"] {
  return value === "Admission" || value === "Monthly"
    ? value
    : PAYMENT_TYPE_FILTER;
}

function parsePaymentMode(value?: string): PaymentFilters["paymentMode"] {
  return value === "Cash" || value === "UPI" ? value : PAYMENT_MODE_FILTER;
}

function parseYear(value: string | undefined, fallback = PAID_FOR_YEAR_FILTER) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 9999
    ? String(year)
    : fallback;
}

function parseMonth(value: string | undefined, fallback: string) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12
    ? String(month)
    : fallback;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const currentYear = new Date().getFullYear();
  const filters: PaymentFilters = {
    search: getParam(query, "search") ?? "",
    paymentType: parsePaymentType(getParam(query, "type")),
    paymentMode: parsePaymentMode(getParam(query, "mode")),
    year: parseYear(getParam(query, "year")),
    month: parseMonth(getParam(query, "month"), PAID_FOR_MONTH_FILTER),
    madeMonth: parseMonth(getParam(query, "madeMonth"), PAID_IN_MONTH_FILTER),
    madeYear: parseYear(getParam(query, "madeYear"), PAID_IN_YEAR_FILTER),
    member: getParam(query, "member") ?? "",
  };

  const [paymentsResponse, allPaymentsResponse, membersResponse] =
    await Promise.all([
      getPayments({
        memberName: filters.search || undefined,
        memberId: filters.member || undefined,
        paymentType:
          filters.paymentType === PAYMENT_TYPE_FILTER
            ? undefined
            : (filters.paymentType as PaymentType),
        paymentMode:
          filters.paymentMode === PAYMENT_MODE_FILTER
            ? undefined
            : (filters.paymentMode as PaymentMode),
        year:
          filters.year === PAID_FOR_YEAR_FILTER ? undefined : Number(filters.year),
        month:
          filters.month === PAID_FOR_MONTH_FILTER
            ? undefined
            : Number(filters.month),
        madeMonth:
          filters.madeMonth === PAID_IN_MONTH_FILTER
            ? undefined
            : Number(filters.madeMonth),
        madeYear:
          filters.madeYear === PAID_IN_YEAR_FILTER
            ? undefined
            : Number(filters.madeYear),
      }),
      getPayments(),
      getMembers(),
    ]);

  const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear - index);

  return (
    <PaymentsWorkflow
      payments={paymentsResponse.data ?? []}
      allPayments={allPaymentsResponse.data ?? []}
      members={membersResponse.data ?? []}
      filters={filters}
      yearOptions={yearOptions}
    />
  );
}
