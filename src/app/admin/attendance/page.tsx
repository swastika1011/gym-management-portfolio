import { getAttendance } from "@/actions/attendance.actions";
import { getMembers } from "@/actions/member.actions";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { AttendanceWorkflow } from "@/components/attendance/AttendanceWorkflow";

export default async function AttendancePage() {
  const [attendanceResponse, membersResponse] = await Promise.all([
    getAttendance(),
    getMembers({ active: true }),
  ]);

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
