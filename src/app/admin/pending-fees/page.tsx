import { getMembers } from "@/actions/member.actions";
import {
  getPayments,
  getPendingFeesSummary,
} from "@/actions/payment.actions";
import { PendingFeesWorkflow } from "@/components/payments/PendingFeesWorkflow";

export default async function PendingFeesPage() {
  const currentYear = new Date().getFullYear();
  const [summaryResponse, membersResponse, paymentsResponse] =
    await Promise.all([getPendingFeesSummary(), getMembers(), getPayments()]);
  const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear - index);

  return (
    <PendingFeesWorkflow
      summary={
        summaryResponse.data ?? {
          pendingMembersCount: 0,
          totalOutstandingAmount: 0,
          items: [],
        }
      }
      members={membersResponse.data ?? []}
      payments={paymentsResponse.data ?? []}
      yearOptions={yearOptions}
    />
  );
}
