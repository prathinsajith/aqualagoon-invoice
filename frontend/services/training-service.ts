import { api } from "@/lib/axios";
import type { Paginated } from "@/types/rbac";
import type { ProductStatus } from "@/types/product";
import type {
    Attendance,
    AttendanceStatus,
    AttendanceSummary,
    BatchStatus,
    EnrollmentStatus,
    FeeLedgerRow,
    FeeLedgerStatus,
    FeePaymentHistoryRow,
    FeePlan,
    StudentEnrollment,
    StudentFee,
    StudentFeeStatus,
    TrainingBatch,
    TrainingDurationType,
    TrainingProgram,
    TrainingType,
} from "@/types/training";

// --- Training types ---------------------------------------------------------

export interface TrainingTypePayload {
    name: string;
    description?: string | null;
    status?: ProductStatus;
}

export const TrainingTypeService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: ProductStatus; sortBy?: "createdAt" | "name"; sortOrder?: "asc" | "desc" }): Promise<Paginated<TrainingType>> =>
        (await api.get("/api/training-types", { params })).data,
    create: async (payload: TrainingTypePayload): Promise<TrainingType> =>
        (await api.post("/api/training-types", payload)).data.data,
    update: async (id: string, payload: Partial<TrainingTypePayload>): Promise<TrainingType> =>
        (await api.put(`/api/training-types/${id}`, payload)).data.data,
    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/training-types/${id}`);
    },
};

// --- Training programs -------------------------------------------------------

export interface TrainingProgramPayload {
    trainingTypeId: string;
    name: string;
    description?: string | null;
    durationType: TrainingDurationType;
    durationValue: number;
    defaultFee: number;
    status?: ProductStatus;
}

export const TrainingProgramService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: ProductStatus; trainingTypeId?: string; sortBy?: "createdAt" | "name"; sortOrder?: "asc" | "desc" }): Promise<Paginated<TrainingProgram>> =>
        (await api.get("/api/training-programs", { params })).data,
    create: async (payload: TrainingProgramPayload): Promise<TrainingProgram> =>
        (await api.post("/api/training-programs", payload)).data.data,
    update: async (id: string, payload: Partial<TrainingProgramPayload>): Promise<TrainingProgram> =>
        (await api.put(`/api/training-programs/${id}`, payload)).data.data,
    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/training-programs/${id}`);
    },
};

// --- Fee plans ---------------------------------------------------------------

export interface FeePlanPayload {
    trainingProgramId: string;
    name: string;
    durationType: TrainingDurationType;
    durationDays: number;
    amount: number;
    description?: string | null;
    status?: ProductStatus;
}

export const FeePlanService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: ProductStatus; trainingProgramId?: string; sortBy?: "createdAt" | "name" | "amount"; sortOrder?: "asc" | "desc" }): Promise<Paginated<FeePlan>> =>
        (await api.get("/api/fee-plans", { params })).data,
    create: async (payload: FeePlanPayload): Promise<FeePlan> =>
        (await api.post("/api/fee-plans", payload)).data.data,
    update: async (id: string, payload: Partial<FeePlanPayload>): Promise<FeePlan> =>
        (await api.put(`/api/fee-plans/${id}`, payload)).data.data,
    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/fee-plans/${id}`);
    },
};

// --- Batches -----------------------------------------------------------------

export interface BatchPayload {
    trainingProgramId: string;
    trainerId?: string | null;
    name: string;
    startTime?: string | null;
    endTime?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    capacity?: number;
    status?: BatchStatus;
}

export const BatchService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: BatchStatus; trainingProgramId?: string; trainerId?: string; sortBy?: "createdAt" | "name" | "startDate"; sortOrder?: "asc" | "desc" }): Promise<Paginated<TrainingBatch>> =>
        (await api.get("/api/batches", { params })).data,
    create: async (payload: BatchPayload): Promise<TrainingBatch> =>
        (await api.post("/api/batches", payload)).data.data,
    update: async (id: string, payload: Partial<BatchPayload>): Promise<TrainingBatch> =>
        (await api.put(`/api/batches/${id}`, payload)).data.data,
    remove: async (id: string): Promise<void> => {
        await api.delete(`/api/batches/${id}`);
    },
};

// --- Enrollments -------------------------------------------------------------

export interface EnrollmentPayload {
    studentId: string;
    batchId: string;
    feePlanId?: string | null;
}

export const EnrollmentService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: EnrollmentStatus; batchId?: string; studentId?: string; feePlanId?: string; sortBy?: "createdAt" | "joinedDate"; sortOrder?: "asc" | "desc" }): Promise<Paginated<StudentEnrollment>> =>
        (await api.get("/api/enrollments", { params })).data,
    create: async (payload: EnrollmentPayload): Promise<StudentEnrollment> =>
        (await api.post("/api/enrollments", payload)).data.data,
    update: async (id: string, payload: { status?: EnrollmentStatus; feePlanId?: string | null }): Promise<StudentEnrollment> =>
        (await api.put(`/api/enrollments/${id}`, payload)).data.data,
};

// --- Attendance --------------------------------------------------------------

export interface MarkAttendancePayload {
    studentId: string;
    batchId: string;
    attendanceDate: string;
    status: AttendanceStatus;
    checkIn?: string | null;
    checkOut?: string | null;
}

export const AttendanceService = {
    list: async (params: { page?: number; limit?: number; batchId?: string; studentId?: string; status?: AttendanceStatus; attendanceDate?: string; dateFrom?: string; dateTo?: string; sortBy?: "attendanceDate" | "createdAt"; sortOrder?: "asc" | "desc" }): Promise<Paginated<Attendance>> =>
        (await api.get("/api/attendance", { params })).data,
    mark: async (payload: MarkAttendancePayload): Promise<Attendance> =>
        (await api.post("/api/attendance", payload)).data.data,
    bulkMark: async (payload: { batchId: string; attendanceDate: string; records: { studentId: string; status: AttendanceStatus; checkIn?: string | null; checkOut?: string | null }[] }): Promise<{ marked: number }> =>
        (await api.post("/api/attendance/bulk", payload)).data.data,
    update: async (id: string, payload: { status?: AttendanceStatus; checkIn?: string | null; checkOut?: string | null }): Promise<Attendance> =>
        (await api.put(`/api/attendance/${id}`, payload)).data.data,
    summary: async (params: { studentId?: string; batchId?: string; dateFrom?: string; dateTo?: string }): Promise<AttendanceSummary> =>
        (await api.get("/api/attendance/summary", { params })).data.data,
};

// --- Student fees ------------------------------------------------------------

export interface GenerateFeePayload {
    enrollmentId: string;
    feePlanId?: string | null;
    amount?: number;
    discountAmount?: number;
    dueDate?: string | null;
}

export const StudentFeeService = {
    list: async (params: { page?: number; limit?: number; search?: string; status?: StudentFeeStatus; studentId?: string; enrollmentId?: string; feePlanId?: string; outstanding?: boolean; sortBy?: "createdAt" | "dueDate"; sortOrder?: "asc" | "desc" }): Promise<Paginated<StudentFee>> =>
        (await api.get("/api/student-fees", { params })).data,
    ledger: async (params: { page?: number; limit?: number; search?: string; status?: FeeLedgerStatus; batchId?: string; sortBy?: "createdAt" | "joinedDate"; sortOrder?: "asc" | "desc" }): Promise<Paginated<FeeLedgerRow>> =>
        (await api.get("/api/student-fees/ledger", { params })).data,
    history: async (enrollmentId: string): Promise<FeePaymentHistoryRow[]> =>
        (await api.get("/api/student-fees/history", { params: { enrollmentId } })).data.data,
    create: async (payload: GenerateFeePayload): Promise<StudentFee> =>
        (await api.post("/api/student-fees", payload)).data.data,
};
