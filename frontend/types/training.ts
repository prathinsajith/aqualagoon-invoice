import type { ProductStatus } from "@/types/product";

export type TrainingDurationType = "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";
export type BatchStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED" | "PAUSED";
export type StudentFeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

interface Ref {
    id: string;
    name: string;
}
interface PersonRef {
    id: string;
    firstName: string;
    lastName: string;
}

export interface TrainingType {
    id: string;
    name: string;
    description: string | null;
    status: ProductStatus;
    programsCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface TrainingProgram {
    id: string;
    trainingType: Ref;
    name: string;
    description: string | null;
    durationType: TrainingDurationType;
    durationValue: number;
    defaultFee: number;
    status: ProductStatus;
    batchesCount: number;
    feePlansCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface FeePlan {
    id: string;
    program: Ref;
    name: string;
    durationType: TrainingDurationType;
    amount: number;
    description: string | null;
    status: ProductStatus;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface TrainingBatch {
    id: string;
    trainingProgramId: string;
    program: Ref;
    trainerId: string | null;
    trainer: PersonRef | null;
    trainerName: string | null;
    name: string;
    startTime: string | null;
    endTime: string | null;
    startDate: string | null;
    endDate: string | null;
    capacity: number;
    currentStrength: number;
    status: BatchStatus;
    enrollmentsCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface StudentEnrollment {
    id: string;
    student: PersonRef;
    batch: { id: string; name: string; program: Ref };
    feePlan: { id: string; name: string; amount: number } | null;
    joinedDate: string;
    status: EnrollmentStatus;
    createdAt: string;
}

export interface Attendance {
    id: string;
    student: PersonRef;
    batch: Ref;
    attendanceDate: string;
    checkIn: string | null;
    checkOut: string | null;
    status: AttendanceStatus;
    markedBy: string | null;
    createdAt: string;
}

export interface AttendanceSummary {
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    percentage: number;
}

export type FeeLedgerStatus = "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "NO_FEE";

/** One row of the per-student fee ledger (rolled up per enrollment). */
export interface FeeLedgerRow {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    programName: string;
    batchName: string;
    feeCount: number;
    billed: number;
    paid: number;
    balance: number;
    status: FeeLedgerStatus;
}

export interface StudentFee {
    id: string;
    student: PersonRef;
    enrollmentId: string;
    feePlan: Ref | null;
    amount: number;
    discountAmount: number;
    finalAmount: number;
    paidAmount: number;
    dueDate: string | null;
    status: StudentFeeStatus;
    invoiceId: string | null;
    createdAt: string;
}
