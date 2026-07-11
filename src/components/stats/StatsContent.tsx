"use client";

import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck, CalendarDays, Clock3, Star, Users } from "lucide-react";

import type {
  AttendanceTrendPoint,
  StatsChartPoint,
  StatsData,
  TopVisitorData,
} from "@/actions/stats.actions";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatsMonthYearSelect } from "@/components/stats/StatsMonthYearSelect";

export interface StatsContentProps {
  stats: StatsData;
  selectedMonth: number;
  selectedYear: number;
  years: number[];
}

const chartMargin = { top: 16, right: 16, bottom: 0, left: -18 };

const visitorColumns: ColumnDef<TopVisitorData, unknown>[] = [
  {
    accessorKey: "memberName",
    header: "Member Name",
    cell: ({ row }) => (
      <span className="font-semibold text-[#3F0000]">
        {row.original.memberName}
      </span>
    ),
  },
  {
    accessorKey: "totalVisits",
    header: "Total Visits",
    cell: ({ row }) => (
      <span className="font-semibold text-[#9A3412]">
        {row.original.totalVisits}
      </span>
    ),
  },
];

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Check-ins",
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#FFAA83] bg-white px-3 py-2 text-[13px] text-[#3F0000] shadow-sm">
      <p className="font-semibold">{label}</p>
      <p className="text-[#737373]">
        {payload[0]?.name ?? valueLabel}:{" "}
        <span className="font-semibold text-[#9A3412]">
          {payload[0]?.value ?? 0}
        </span>
      </p>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionCard
      title={title}
      headerAction={
        <div className="grid size-9 place-items-center rounded-xl bg-[#9A3412]/10 text-[#9A3412]">
          {icon}
        </div>
      }
      contentClassName="h-[300px]"
    >
      {children}
    </SectionCard>
  );
}

function BarStatsChart({
  data,
  valueLabel = "Check-ins",
}: {
  data: StatsChartPoint[];
  valueLabel?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid stroke="#FFAA83" strokeOpacity={0.35} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "#FFAA83" }}
          tick={{ fill: "#3F0000", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#737373", fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip
          content={<ChartTooltip valueLabel={valueLabel} />}
          cursor={{ fill: "#FFEADE" }}
        />
        <Bar
          dataKey="value"
          name={valueLabel}
          fill="#9A3412"
          radius={[8, 8, 0, 0]}
          maxBarSize={38}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function AttendanceLineChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid stroke="#FFAA83" strokeOpacity={0.35} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "#FFAA83" }}
          tick={{ fill: "#3F0000", fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#737373", fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="checkIns"
          name="Check-ins"
          stroke="#9A3412"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#9A3412", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#800000" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatsContent({
  stats,
  selectedMonth,
  selectedYear,
  years,
}: StatsContentProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Stats & Analytics"
        description="Detailed insights about your gym."
        action={
          <StatsMonthYearSelect
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            years={years}
          />
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          description="Members checked in today"
          icon={<Users strokeWidth={1.75} />}
          color="primary"
        />
        <StatCard
          title="This Month's Check-ins"
          value={stats.monthCheckIns}
          description="Total check-ins this month"
          icon={<CalendarCheck strokeWidth={1.75} />}
          color="success"
        />
        <StatCard
          title="Peak Hour"
          value={stats.peakHour}
          description="Most active hour"
          icon={<Clock3 strokeWidth={1.75} />}
          color="warning"
        />
        <StatCard
          title="Busiest Day"
          value={stats.busiestDay}
          description="Most active day"
          icon={<Star strokeWidth={1.75} />}
          color="accent"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Busy Hours"
          icon={<Clock3 className="size-5" strokeWidth={1.75} />}
        >
          <BarStatsChart data={stats.busyHours} />
        </ChartCard>
        <ChartCard
          title="Busy Days"
          icon={<CalendarDays className="size-5" strokeWidth={1.75} />}
        >
          <BarStatsChart data={stats.busyDays} />
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Attendance Trend"
          icon={<CalendarCheck className="size-5" strokeWidth={1.75} />}
        >
          <AttendanceLineChart data={stats.attendanceTrend} />
        </ChartCard>
        <ChartCard
          title="New Members"
          icon={<Users className="size-5" strokeWidth={1.75} />}
        >
          <BarStatsChart data={stats.newMembers} valueLabel="Members" />
        </ChartCard>
      </section>

      <SectionCard title="Top Visitors (This Month)">
        <DataTable
          columns={visitorColumns}
          data={stats.topVisitors}
          enableSearch={false}
          enablePagination={false}
          emptyTitle="No visits this month"
          emptyDescription="Top visitors will appear after attendance is marked."
        />
      </SectionCard>
    </div>
  );
}
