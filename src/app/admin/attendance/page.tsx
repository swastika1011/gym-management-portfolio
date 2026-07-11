import { getAttendance } from "@/actions/attendance.actions";
import { getMembers } from "@/actions/member.actions";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AttendanceWorkflow } from "@/components/attendance/AttendanceWorkflow";

export const dynamic = "force-dynamic";

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : value;
}

function parseYear(value: string | undefined, fallback: number) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 9999
    ? year
    : fallback;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const now = new Date();
  const selectedDate = parseDate(getParam(query, "date"));
  const selectedYear = parseYear(getParam(query, "year"), now.getFullYear());
  const [attendanceResponse, membersResponse] = await Promise.all([
    getAttendance({
      date: selectedDate || undefined,
      year: selectedDate ? undefined : selectedYear,
    }),
    getMembers({ active: true }),
  ]);
  const yearOptions = Array.from(
    { length: 8 },
    (_, index) => now.getFullYear() - index
  );
  const years = yearOptions.includes(selectedYear)
    ? yearOptions
    : [selectedYear, ...yearOptions].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attendance"
        description="Manage check-ins and check-outs without leaving this page."
      />

      {attendanceResponse.success && membersResponse.success ? (
        <AttendanceWorkflow
          attendance={attendanceResponse.data ?? []}
          members={membersResponse.data ?? []}
          selectedDate={selectedDate}
          selectedYear={selectedYear}
          years={years}
        />
      ) : (
        <EmptyState
          title="Unable to load attendance"
          description={
            attendanceResponse.success
              ? membersResponse.message
              : attendanceResponse.message
          }
        />
      )}
    </div>
  );
}
