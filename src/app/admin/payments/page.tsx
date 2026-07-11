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

function parsePaymentDate(value: string | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : "";
}

function parsePaidForDate(value: string | undefined) {
  return /^\d{4}-\d{2}$/.test(value ?? "") ? value! : "";
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
    paidForDate: parsePaidForDate(getParam(query, "paidFor")),
    paymentDate: parsePaymentDate(getParam(query, "paymentDate")),
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
        year: filters.paidForDate
          ? Number(filters.paidForDate.slice(0, 4))
          : undefined,
        month: filters.paidForDate
          ? Number(filters.paidForDate.slice(5, 7))
          : undefined,
        paymentDate: filters.paymentDate || undefined,
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
