"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconCircleCheck,
  IconCircleX,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateText } from "@/components/date-text";
import { cn } from "@/lib/utils";
import type { EnrollmentStatus, StudentEnrollment } from "@/types/training";

const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  ACTIVE: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  COMPLETED: "border-transparent bg-muted text-muted-foreground",
  DROPPED: "border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  PAUSED: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "Paused",
};

function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Session-pack days left: counts down as the student is marked present/late. */
function DaysLeftCell({ enrollment }: { enrollment: StudentEnrollment }) {
  const { daysRemaining, attendedDays, feePlan } = enrollment;
  if (daysRemaining === null || !feePlan) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const total = feePlan.durationDays;
  const used = attendedDays ?? 0;
  const tone =
    daysRemaining <= 0
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
      : daysRemaining <= 5
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={cn("w-fit font-medium tabular-nums", "border-transparent", tone)}>
        {daysRemaining <= 0 ? "Expired" : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`}
      </Badge>
      <span className="text-xs text-muted-foreground tabular-nums">{used}/{total} used</span>
    </div>
  );
}

interface ColumnHandlers {
  onChangeStatus: (enrollment: StudentEnrollment, status: EnrollmentStatus) => void;
  canUpdate: boolean;
}

export function getEnrollmentColumns({
  onChangeStatus,
  canUpdate,
}: ColumnHandlers): ColumnDef<StudentEnrollment>[] {
  return [
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const s = row.original.student;
        return (
          <span className="font-medium">
            {s.firstName} {s.lastName}
          </span>
        );
      },
    },
    {
      id: "batch",
      header: "Batch",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.batch.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.batch.program.name}</span>
        </div>
      ),
    },
    {
      id: "feePlan",
      header: "Fee plan",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.feePlan?.name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "joinedDate",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm">
          <DateText value={row.original.joinedDate} />
        </span>
      ),
    },
    {
      id: "daysLeft",
      header: "Days left",
      cell: ({ row }) => <DaysLeftCell enrollment={row.original} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <EnrollmentStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        if (!canUpdate) return null;
        const e = row.original;
        return (
          <div className="flex justify-end" onClick={(ev) => ev.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <IconDotsVertical className="size-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {e.status !== "PAUSED" && e.status !== "DROPPED" && e.status !== "COMPLETED" && (
                  <DropdownMenuItem onClick={() => onChangeStatus(e, "PAUSED")}>
                    <IconPlayerPause className="size-4" /> Pause
                  </DropdownMenuItem>
                )}
                {e.status === "PAUSED" && (
                  <DropdownMenuItem onClick={() => onChangeStatus(e, "ACTIVE")}>
                    <IconPlayerPlay className="size-4" /> Resume
                  </DropdownMenuItem>
                )}
                {e.status !== "COMPLETED" && (
                  <DropdownMenuItem onClick={() => onChangeStatus(e, "COMPLETED")}>
                    <IconCircleCheck className="size-4" /> Mark completed
                  </DropdownMenuItem>
                )}
                {e.status !== "DROPPED" && (
                  <DropdownMenuItem variant="destructive" onClick={() => onChangeStatus(e, "DROPPED")}>
                    <IconCircleX className="size-4" /> Mark dropped
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
