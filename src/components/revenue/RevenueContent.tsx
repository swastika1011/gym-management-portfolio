import type { ReactNode } from "react";
import { ArrowDown, Clock3, CreditCard, WalletCards } from "lucide-react";

import type { RevenueData } from "@/actions/payment.actions";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { RevenueMonthYearSelect } from "@/components/revenue/RevenueMonthYearSelect";
import { cn } from "@/lib/utils";

export interface RevenueContentProps {
  revenue: RevenueData;
  selectedMonth: number;
  selectedYear: number;
  years: number[];
}

type RevenueGroup = "monthly" | "admission" | "total";
type RevenueTone = "expected" | "collected" | "outstanding";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const groupStyles: Record<RevenueGroup, { label: string; text: string; bg: string }> = {
  monthly: {
    label: "Monthly Fees",
    text: "text-[#7E22CE]",
    bg: "bg-[#F3E8FF]",
  },
  admission: {
    label: "Admission Fees",
    text: "text-[#2F7D45]",
    bg: "bg-[#E8F5EC]",
  },
  total: {
    label: "Totals",
    text: "text-[#1D64C8]",
    bg: "bg-[#EAF2FF]",
  },
};

const toneStyles: Record<RevenueTone, string> = {
  expected: "bg-[#FFF7ED] text-[#9A3412]",
  collected: "bg-[#F3E8FF] text-[#7E22CE]",
  outstanding: "bg-[#FEF2F2] text-[#DC2626]",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function RevenueMetricCard({
  title,
  value,
  description,
  icon,
  index,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  index: string;
  tone: RevenueTone;
}) {
  return (
    <SectionCard contentClassName="flex items-start gap-4">
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          toneStyles[tone]
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[15px] font-semibold leading-5 text-[#3F0000]">
            {title}
          </p>
          <span className="rounded-xl bg-[#FFEADE] px-3 py-2 text-[13px] font-bold text-[#9A3412]">
            {index}
          </span>
        </div>
        <p
          className={cn(
            "mt-2 [font-family:Manrope,var(--font-geist-sans),sans-serif] text-3xl font-bold leading-none",
            tone === "outstanding" ? "text-[#DC2626]" : "text-[#3F0000]"
          )}
        >
          {formatCurrency(value)}
        </p>
        <p className="mt-3 text-[14px] leading-5 text-[#737373]">
          {description}
        </p>
      </div>
    </SectionCard>
  );
}

function RevenueSection({
  group,
  children,
}: {
  group: RevenueGroup;
  children: ReactNode;
}) {
  const styles = groupStyles[group];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("grid size-7 place-items-center rounded-lg", styles.bg)}>
          <CreditCard className={cn("size-4", styles.text)} strokeWidth={1.75} />
        </span>
        <h2
          className={cn(
            "[font-family:Manrope,var(--font-geist-sans),sans-serif] text-[18px] font-semibold",
            styles.text
          )}
        >
          {styles.label}
        </h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export function RevenueContent({
  revenue,
  selectedMonth,
  selectedYear,
  years,
}: RevenueContentProps) {
  const selectedLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revenue"
        description={`Overview of expected, collected and outstanding revenue for ${selectedLabel}.`}
        action={
          <RevenueMonthYearSelect
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            years={years}
          />
        }
      />

      <RevenueSection group="monthly">
        <RevenueMetricCard
          title="Expected Monthly Fee Revenue"
          value={revenue.monthlyFees.expectedRevenue}
          description="Expected from active members due for this month"
          icon={<WalletCards className="size-6" strokeWidth={1.75} />}
          index="01"
          tone="expected"
        />
        <RevenueMetricCard
          title="Monthly Fee Revenue Collected"
          value={revenue.monthlyFees.collectedRevenue}
          description="Monthly fee payments for the selected month"
          icon={<ArrowDown className="size-6" strokeWidth={1.75} />}
          index="02"
          tone="collected"
        />
        <RevenueMetricCard
          title="Outstanding Monthly Fee Revenue"
          value={revenue.monthlyFees.outstandingRevenue}
          description="Selected month expected minus collected"
          icon={<Clock3 className="size-6" strokeWidth={1.75} />}
          index="03"
          tone="outstanding"
        />
      </RevenueSection>

      <RevenueSection group="admission">
        <RevenueMetricCard
          title="Expected Admission Fee Revenue"
          value={revenue.admissionFees.expectedRevenue}
          description="From admission fees pending during this month"
          icon={<WalletCards className="size-6" strokeWidth={1.75} />}
          index="04"
          tone="expected"
        />
        <RevenueMetricCard
          title="Admission Fee Revenue Collected"
          value={revenue.admissionFees.collectedRevenue}
          description="Admission fee payments received this month"
          icon={<ArrowDown className="size-6" strokeWidth={1.75} />}
          index="05"
          tone="collected"
        />
        <RevenueMetricCard
          title="Outstanding Admission Fee Revenue"
          value={revenue.admissionFees.outstandingRevenue}
          description="Expected admission fees minus collected"
          icon={<Clock3 className="size-6" strokeWidth={1.75} />}
          index="06"
          tone="outstanding"
        />
      </RevenueSection>

      <RevenueSection group="total">
        <RevenueMetricCard
          title="Total Expected Revenue"
          value={revenue.totals.expectedRevenue}
          description="Monthly fees plus admission fees"
          icon={<WalletCards className="size-6" strokeWidth={1.75} />}
          index="07"
          tone="expected"
        />
        <RevenueMetricCard
          title="Total Revenue Collected"
          value={revenue.totals.collectedRevenue}
          description="Monthly and admission fees collected"
          icon={<ArrowDown className="size-6" strokeWidth={1.75} />}
          index="08"
          tone="collected"
        />
        <RevenueMetricCard
          title="Total Outstanding Revenue"
          value={revenue.totals.outstandingRevenue}
          description="Outstanding monthly and admission fees"
          icon={<Clock3 className="size-6" strokeWidth={1.75} />}
          index="09"
          tone="outstanding"
        />
      </RevenueSection>

      <div className="rounded-xl border border-[#FFAA83] bg-[#FFF7ED] px-4 py-3 text-[14px] font-medium text-[#7C2D12]">
        All amounts are calculated for {selectedLabel}.
      </div>
    </div>
  );
}
