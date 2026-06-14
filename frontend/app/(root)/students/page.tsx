"use client";

import { IconUserPlus, IconCalendarCheck, IconCash } from "@tabler/icons-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoAccess } from "@/components/rbac/no-access";
import { ListPageSkeleton } from "@/components/skeletons";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/auth-store";

import { EnrollmentsContent } from "../enrollments/page";
import { AttendanceContent } from "../attendance/page";
import { StudentFeesContent } from "../student-fees/page";

/**
 * Unified "Students" workspace — enrollment, attendance and fees are the three
 * day-to-day student desk tasks, so they live together as tabs. Each tab is
 * shown only if the user holds its permission.
 */
export default function StudentsPage() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { can } = usePermissions();
  const canEnrollments = can("enrollment.view");
  const canAttendance = can("attendance.view");
  const canFees = can("student_fee.view");

  if (isInitializing) {
    return <ListPageSkeleton />;
  }

  if (!canEnrollments && !canAttendance && !canFees) return <NoAccess />;

  const defaultTab = canEnrollments ? "enrollments" : canAttendance ? "attendance" : "fees";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList>
        {canEnrollments && (
          <TabsTrigger value="enrollments" className="gap-1.5">
            <IconUserPlus className="size-4" /> Enrollments
          </TabsTrigger>
        )}
        {canAttendance && (
          <TabsTrigger value="attendance" className="gap-1.5">
            <IconCalendarCheck className="size-4" /> Attendance
          </TabsTrigger>
        )}
        {canFees && (
          <TabsTrigger value="fees" className="gap-1.5">
            <IconCash className="size-4" /> Fees
          </TabsTrigger>
        )}
      </TabsList>

      {canEnrollments && (
        <TabsContent value="enrollments" className="mt-0">
          <EnrollmentsContent />
        </TabsContent>
      )}
      {canAttendance && (
        <TabsContent value="attendance" className="mt-0">
          <AttendanceContent />
        </TabsContent>
      )}
      {canFees && (
        <TabsContent value="fees" className="mt-0">
          <StudentFeesContent />
        </TabsContent>
      )}
    </Tabs>
  );
}
