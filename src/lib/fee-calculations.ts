export function calculateOutstandingAmount({
  admissionFee,
  admissionFeePaid,
  monthlyFee,
  pendingMonths,
}: {
  admissionFee: number;
  admissionFeePaid: boolean;
  monthlyFee: number;
  pendingMonths: number;
}) {
  const admissionDue = admissionFeePaid ? 0 : admissionFee;
  const monthlyDue = pendingMonths * monthlyFee;

  return {
    admissionDue,
    monthlyDue,
    outstandingAmount: admissionDue + monthlyDue,
  };
}
