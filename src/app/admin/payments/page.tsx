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

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePaymentType(value?: string): PaymentFilters["paymentType"] {
  return value === "Admission" || value === "Monthly" ? value : "All";
}

function parsePaymentMode(value?: string): PaymentFilters["paymentMode"] {
  return value === "Cash" || value === "UPI" ? value : "All";
}

function parseYear(value?: string) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 9999
    ? String(year)
    : "All";
}

function parseMonth(value?: string) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12
    ? String(month)
    : "All";
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
    month: parseMonth(getParam(query, "month")),
    member: getParam(query, "member") ?? "",
  };

  const [paymentsResponse, allPaymentsResponse, membersResponse] =
    await Promise.all([
      getPayments({
        memberName: filters.search || undefined,
        memberId: filters.member || undefined,
        paymentType:
          filters.paymentType === "All"
            ? undefined
            : (filters.paymentType as PaymentType),
        paymentMode:
          filters.paymentMode === "All"
            ? undefined
            : (filters.paymentMode as PaymentMode),
        year: filters.year === "All" ? undefined : Number(filters.year),
        month: filters.month === "All" ? undefined : Number(filters.month),
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
