"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AttendanceService,
    BatchService,
    EnrollmentService,
    FeePlanService,
    StudentFeeService,
    TrainingProgramService,
    TrainingTypeService,
    type BatchPayload,
    type EnrollmentPayload,
    type FeePlanPayload,
    type GenerateFeePayload,
    type MarkAttendancePayload,
    type TrainingProgramPayload,
    type TrainingTypePayload,
} from "@/services/training-service";
import type { EnrollmentStatus } from "@/types/training";

/** Query options accepted by the list hooks (e.g. gate fetching on dialog open). */
interface ListHookOptions {
    enabled?: boolean;
}

/**
 * Builds a typed list query hook from a service `list` function. Params are
 * inferred from the service signature (no `any`), and an optional `enabled`
 * lets callers gate the fetch (e.g. only when a dialog is open).
 */
const list =
    <P, T>(key: string, fn: (params: P) => Promise<T>) =>
    (params: P, options?: ListHookOptions) =>
        useQuery({
            queryKey: [key, "list", params],
            queryFn: () => fn(params),
            placeholderData: keepPreviousData,
            enabled: options?.enabled,
        });

// --- Training types ---
export const useTrainingTypes = list("training-types", TrainingTypeService.list);
export function useTrainingTypeMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: TrainingTypePayload) => TrainingTypeService.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-types"] }) }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<TrainingTypePayload> }) => TrainingTypeService.update(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-types"] }) }),
        remove: useMutation({ mutationFn: (id: string) => TrainingTypeService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-types"] }) }),
    };
}

// --- Training programs ---
export const useTrainingPrograms = list("training-programs", TrainingProgramService.list);
export function useTrainingProgramMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: TrainingProgramPayload) => TrainingProgramService.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-programs"] }) }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<TrainingProgramPayload> }) => TrainingProgramService.update(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-programs"] }) }),
        remove: useMutation({ mutationFn: (id: string) => TrainingProgramService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["training-programs"] }) }),
    };
}

// --- Fee plans ---
export const useFeePlans = list("fee-plans", FeePlanService.list);
export function useFeePlanMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: FeePlanPayload) => FeePlanService.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-plans"] }) }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<FeePlanPayload> }) => FeePlanService.update(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-plans"] }) }),
        remove: useMutation({ mutationFn: (id: string) => FeePlanService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-plans"] }) }),
    };
}

// --- Batches ---
export const useBatches = list("batches", BatchService.list);
export function useBatchMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: BatchPayload) => BatchService.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }) }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<BatchPayload> }) => BatchService.update(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }) }),
        remove: useMutation({ mutationFn: (id: string) => BatchService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }) }),
    };
}

// --- Enrollments ---
export const useEnrollments = list("enrollments", EnrollmentService.list);
export function useEnrollmentMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: EnrollmentPayload) => EnrollmentService.create(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ["enrollments"] }); qc.invalidateQueries({ queryKey: ["batches"] }); } }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: { status?: EnrollmentStatus; feePlanId?: string | null } }) => EnrollmentService.update(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ["enrollments"] }); qc.invalidateQueries({ queryKey: ["batches"] }); } }),
    };
}

// --- Attendance ---
export const useAttendance = list("attendance", AttendanceService.list);
export function useAttendanceSummary(params: { studentId?: string; batchId?: string; dateFrom?: string; dateTo?: string }, enabled = true) {
    return useQuery({ queryKey: ["attendance", "summary", params], queryFn: () => AttendanceService.summary(params), enabled });
}
export function useAttendanceMutations() {
    const qc = useQueryClient();
    // Marking attendance burns/credits session days, so enrollments (days left) refresh too.
    return {
        mark: useMutation({ mutationFn: (p: MarkAttendancePayload) => AttendanceService.mark(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); qc.invalidateQueries({ queryKey: ["enrollments"] }); } }),
        bulkMark: useMutation({ mutationFn: (p: Parameters<typeof AttendanceService.bulkMark>[0]) => AttendanceService.bulkMark(p), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); qc.invalidateQueries({ queryKey: ["enrollments"] }); } }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof AttendanceService.update>[1] }) => AttendanceService.update(id, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); qc.invalidateQueries({ queryKey: ["enrollments"] }); } }),
    };
}

// --- Student fees ---
export const useStudentFees = list("student-fees", StudentFeeService.list);
// Ledger keyed under "student-fees" so generating a fee invalidates it too.
export function useStudentFeeLedger(params: Parameters<typeof StudentFeeService.ledger>[0]) {
    return useQuery({
        queryKey: ["student-fees", "ledger", params],
        queryFn: () => StudentFeeService.ledger(params),
        placeholderData: keepPreviousData,
    });
}
// Payment history for one enrollment. Keyed under "student-fees" so collecting
// a fee invalidates it; only fetches when a row is open (enabled).
export function useFeeHistory(enrollmentId: string | null, enabled = true) {
    return useQuery({
        queryKey: ["student-fees", "history", enrollmentId],
        queryFn: () => StudentFeeService.history(enrollmentId!),
        enabled: enabled && !!enrollmentId,
    });
}
export function useStudentFeeMutations() {
    const qc = useQueryClient();
    return {
        create: useMutation({ mutationFn: (p: GenerateFeePayload) => StudentFeeService.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["student-fees"] }) }),
    };
}
