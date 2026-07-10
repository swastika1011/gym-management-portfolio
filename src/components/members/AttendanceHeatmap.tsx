import {
  type AttendanceRecord,
  formatDate,
  formatTime,
} from "@/components/members/member-utils";
import { cn } from "@/lib/utils";

export interface AttendanceHeatmapProps {
  attendance: AttendanceRecord[];
  year: number;
}

function toDateKey(value: Date | string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

function getMaxStreak(dateKeys: Set<string>) {
  const sortedKeys = Array.from(dateKeys).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let previousTime = 0;

  for (const key of sortedKeys) {
    const currentTime = new Date(key).getTime();
    const diffInDays = previousTime
      ? Math.round((currentTime - previousTime) / 86_400_000)
      : 0;

    currentStreak = diffInDays === 1 ? currentStreak + 1 : 1;
    maxStreak = Math.max(maxStreak, currentStreak);
    previousTime = currentTime;
  }

  return maxStreak;
}

export function AttendanceHeatmap({ attendance, year }: AttendanceHeatmapProps) {
  const startMonth = new Date(year, 0, 1);
  const recordsByDate = new Map(
    attendance
      .filter((record) => record.date)
      .map((record) => [toDateKey(record.date!), record])
  );
  const visibleMonthKeys = Array.from({ length: 12 }).flatMap((_, monthIndex) => {
    const monthDate = addMonths(startMonth, monthIndex);
    const days = getDaysInMonth(monthDate);

    return Array.from({ length: days }).map((__, dayIndex) =>
      toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), dayIndex + 1))
    );
  });
  const visibleDateKeys = new Set(visibleMonthKeys);
  const activeDateKeys = new Set(
    Array.from(recordsByDate.keys()).filter((key) => visibleDateKeys.has(key))
  );
  const totalActiveDays = activeDateKeys.size;
  const maxStreak = getMaxStreak(activeDateKeys);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#FFAA83] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium text-[#3F0000]">
            <span className="text-2xl font-bold">{totalActiveDays}</span>{" "}
            active days in {year}
          </p>
          <div className="flex flex-wrap gap-4 text-[14px] font-medium text-[#737373]">
            <span>
              Total active days:{" "}
              <strong className="text-[#3F0000]">{totalActiveDays}</strong>
            </span>
            <span>
              Max streak:{" "}
              <strong className="text-[#3F0000]">{maxStreak}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-5">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const monthDate = addMonths(startMonth, monthIndex);
              const days = getDaysInMonth(monthDate);
              const leadingBlanks = new Date(
                monthDate.getFullYear(),
                monthDate.getMonth(),
                1
              ).getDay();

              return (
                <div key={monthDate.toISOString()} className="space-y-2">
                  <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {Array.from({ length: leadingBlanks }).map((__, index) => (
                      <span key={`blank-${index}`} className="size-3.5" />
                    ))}
                    {Array.from({ length: days }).map((__, dayIndex) => {
                      const date = new Date(
                        monthDate.getFullYear(),
                        monthDate.getMonth(),
                        dayIndex + 1
                      );
                      const key = toDateKey(date);
                      const record = recordsByDate.get(key);

                      return (
                        <span
                          key={key}
                          title={`${formatDate(date)} | Check In: ${formatTime(
                            record?.timeIn
                          )} | Check Out: ${formatTime(record?.timeOut)}`}
                          className={cn(
                            "size-3.5 rounded-[4px] border transition-colors",
                            record?.timeOut
                              ? "border-[#3F7D58]/30 bg-[#3F7D58]"
                              : record
                                ? "border-[#3F7D58]/20 bg-[#8EE6A0]"
                                : "border-[#FFAA83]/35 bg-[#FFEADE]"
                          )}
                          aria-label={`${formatDate(date)} attendance ${
                            record ? "present" : "absent"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-center text-[14px] font-medium text-[#737373]">
                    {getMonthLabel(monthDate)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
