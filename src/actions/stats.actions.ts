"use server";

import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/attendance";
import Member from "@/models/member";

export type StatsChartPoint = {
  label: string;
  value: number;
};

export type AttendanceTrendPoint = {
  label: string;
  checkIns: number;
};

export type TopVisitorData = {
  memberId: string;
  memberName: string;
  totalVisits: number;
};

export type StatsData = {
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  todayCheckIns: number;
  monthCheckIns: number;
  peakHour: string;
  busiestDay: string;
  busyHours: StatsChartPoint[];
  busyDays: StatsChartPoint[];
  attendanceTrend: AttendanceTrendPoint[];
  newMembers: StatsChartPoint[];
  topVisitors: TopVisitorData[];
};

export type ActionResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

type PopulatedMember = {
  _id?: unknown;
  name?: string;
};

type AttendanceRecord = {
  memberId?: string | PopulatedMember;
  date?: Date;
  timeIn?: Date;
};

type MemberRecord = {
  createdAt?: Date;
  joinDate?: Date;
};

export type StatsDateRangeInput = {
  month?: number;
  year?: number;
};

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function isValidYear(year: unknown): year is number {
  return typeof year === "number" && Number.isInteger(year) && year >= 1900 && year <= 9999;
}

function getSelectedMonthDate(input?: StatsDateRangeInput) {
  const now = new Date();
  const inputMonth = input?.month;
  const inputYear = input?.year;
  const month =
    typeof inputMonth === "number" &&
    Number.isInteger(inputMonth) &&
    inputMonth >= 1 &&
    inputMonth <= 12
      ? inputMonth
      : now.getMonth() + 1;
  const year =
    typeof inputYear === "number" &&
    Number.isInteger(inputYear) &&
    inputYear >= 1900 &&
    inputYear <= 9999
      ? inputYear
      : now.getFullYear();

  return new Date(year, month - 1, 1);
}

function getDateYear(value: unknown) {
  return value ? new Date(value as Date).getFullYear() : undefined;
}

function getYearOptions({
  now,
  selectedYear,
  oldestAttendance,
  oldestMember,
}: {
  now: Date;
  selectedYear: number;
  oldestAttendance?: { date?: Date } | null;
  oldestMember?: { joinDate?: Date; createdAt?: Date } | null;
}) {
  const currentYear = now.getFullYear();
  const oldestYear =
    [
      getDateYear(oldestAttendance?.date),
      getDateYear(oldestMember?.joinDate ?? oldestMember?.createdAt),
      selectedYear,
      currentYear,
    ]
      .filter((year): year is number => isValidYear(year))
      .sort((a, b) => a - b)[0] ?? currentYear;
  const latestYear = Math.max(currentYear, selectedYear);

  return Array.from(
    { length: latestYear - oldestYear + 1 },
    (_, index) => latestYear - index
  );
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display} ${suffix}`;
}

function formatHourRange(hour: number) {
  return `${formatHour(hour)} - ${formatHour((hour + 1) % 24)}`;
}

function getMemberId(memberId: AttendanceRecord["memberId"]) {
  if (typeof memberId === "string") {
    return memberId;
  }

  if (typeof memberId === "object" && memberId !== null && memberId._id) {
    return String(memberId._id);
  }

  return "";
}

function getMemberName(memberId: AttendanceRecord["memberId"]) {
  if (typeof memberId === "object" && memberId !== null && memberId.name) {
    return memberId.name;
  }

  return "Member";
}

export async function getStats(
  input?: StatsDateRangeInput
): Promise<ActionResponse<StatsData>> {
  try {
    await connectDB();

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const selectedMonth = getSelectedMonthDate(input);
    const monthStart = startOfMonth(selectedMonth);
    const nextMonthStart = endOfMonth(selectedMonth);

    const [
      todayAttendance,
      monthAttendance,
      monthMembers,
      oldestAttendance,
      oldestMember,
    ] = await Promise.all([
      Attendance.find({
        date: { $gte: todayStart, $lt: tomorrowStart },
      }).lean(),
      Attendance.find({
        date: { $gte: monthStart, $lt: nextMonthStart },
      })
        .populate("memberId", "name")
        .lean(),
      Member.find({
        $or: [
          { joinDate: { $gte: monthStart, $lt: nextMonthStart } },
          {
            $or: [{ joinDate: { $exists: false } }, { joinDate: null }],
            createdAt: { $gte: monthStart, $lt: nextMonthStart },
          },
        ],
      }).lean(),
      Attendance.findOne().sort({ date: 1 }).select("date").lean(),
      Member.findOne()
        .sort({ joinDate: 1, createdAt: 1 })
        .select("joinDate createdAt")
        .lean(),
    ]);

    const hourCounts = new Map<number, number>();
    for (let hour = 6; hour <= 22; hour += 1) {
      hourCounts.set(hour, 0);
    }

    const dayCounts = new Array(7).fill(0) as number[];
    const daysInMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    ).getDate();
    const trendCounts = new Array(daysInMonth).fill(0) as number[];
    const newMemberCounts = new Array(daysInMonth).fill(0) as number[];
    const visitCounts = new Map<string, TopVisitorData>();

    for (const record of monthAttendance as AttendanceRecord[]) {
      const timeIn = record.timeIn ? new Date(record.timeIn) : null;
      const date = record.date ? new Date(record.date) : timeIn;

      if (!date) {
        continue;
      }

      const hour = timeIn?.getHours();
      if (typeof hour === "number" && hourCounts.has(hour)) {
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }

      dayCounts[date.getDay()] += 1;
      trendCounts[date.getDate() - 1] += 1;

      const memberId = getMemberId(record.memberId);
      if (memberId) {
        const existing = visitCounts.get(memberId);
        visitCounts.set(memberId, {
          memberId,
          memberName: existing?.memberName ?? getMemberName(record.memberId),
          totalVisits: (existing?.totalVisits ?? 0) + 1,
        });
      }
    }

    for (const member of monthMembers as MemberRecord[]) {
      const admittedAt = member.joinDate ?? member.createdAt;
      if (!admittedAt) {
        continue;
      }

      const admittedDate = new Date(admittedAt);
      if (admittedDate >= monthStart && admittedDate < nextMonthStart) {
        newMemberCounts[admittedDate.getDate() - 1] += 1;
      }
    }

    const peakHourEntry = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const busiestDayIndex = dayCounts.reduce(
      (bestIndex, count, index) => (count > dayCounts[bestIndex] ? index : bestIndex),
      0
    );

    return {
      success: true,
      message: "Stats fetched successfully.",
      data: {
        selectedMonth: selectedMonth.getMonth() + 1,
        selectedYear: selectedMonth.getFullYear(),
        yearOptions: getYearOptions({
          now,
          selectedYear: selectedMonth.getFullYear(),
          oldestAttendance,
          oldestMember,
        }),
        todayCheckIns: todayAttendance.length,
        monthCheckIns: monthAttendance.length,
        peakHour: peakHourEntry && peakHourEntry[1] > 0 ? formatHourRange(peakHourEntry[0]) : "-",
        busiestDay: dayCounts[busiestDayIndex] > 0 ? dayLabels[busiestDayIndex] : "-",
        busyHours: Array.from(hourCounts.entries()).map(([hour, value]) => ({
          label: formatHour(hour),
          value,
        })),
        busyDays: shortDayLabels.map((label, index) => ({
          label,
          value: dayCounts[index],
        })),
        attendanceTrend: trendCounts.map((checkIns, index) => ({
          label: `${index + 1}`,
          checkIns,
        })),
        newMembers: newMemberCounts.map((value, index) => ({
          label: `${index + 1}`,
          value,
        })),
        topVisitors: Array.from(visitCounts.values())
          .sort((a, b) => b.totalVisits - a.totalVisits)
          .slice(0, 5),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch stats.",
      data: serialize<StatsData>({
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
        yearOptions: [new Date().getFullYear()],
        todayCheckIns: 0,
        monthCheckIns: 0,
        peakHour: "-",
        busiestDay: "-",
        busyHours: [],
        busyDays: [],
        attendanceTrend: [],
        newMembers: [],
        topVisitors: [],
      }),
    };
  }
}
