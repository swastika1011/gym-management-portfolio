import { getStats } from "@/actions/stats.actions";
import { EmptyState } from "@/components/common/EmptyState";
import { StatsContent } from "@/components/stats/StatsContent";

export const dynamic = "force-dynamic";

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseMonth(value: string | undefined, fallback: number) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : fallback;
}

function parseYear(value: string | undefined, fallback: number) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 9999
    ? year
    : fallback;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const now = new Date();
  const selectedMonth = parseMonth(getParam(query, "month"), now.getMonth() + 1);
  const selectedYear = parseYear(getParam(query, "year"), now.getFullYear());
  const response = await getStats({
    month: selectedMonth,
    year: selectedYear,
  });

  if (!response.success || !response.data) {
    return (
      <EmptyState
        title="Unable to load stats"
        description={response.message}
      />
    );
  }

  const yearOptions = Array.from(
    { length: 8 },
    (_, index) => now.getFullYear() - index
  );
  const years = yearOptions.includes(selectedYear)
    ? yearOptions
    : [selectedYear, ...yearOptions].sort((a, b) => b - a);

  return (
    <StatsContent
      stats={response.data}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      years={years}
    />
  );
}
