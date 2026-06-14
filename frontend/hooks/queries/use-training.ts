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

/* eslint-disable @typescript-eslint/no-explicit-any */

const list = <T,>(key: string, fn: (p: any) => Promise<T>) => (params: any) =>
    useQuery({ queryKey: [key, "list", params], queryFn: () => fn(params), placeholderData: keepPreviousData });

// --- Training types ---
export const useTrainingTypes = list("training-types", TrainingTypeService.list);
export function useTrainingTypeMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["training-types"] });
    return {
        create: useMutation({ mutationFn: (p: TrainingTypePayload) => TrainingTypeService.create(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<TrainingTypePayload> }) => TrainingTypeService.update(id, payload), onSuccess: invalidate }),
        remove: useMutation({ mutationFn: (id: string) => TrainingTypeService.remove(id), onSuccess: invalidate }),
    };
}

// --- Training programs ---
export const useTrainingPrograms = list("training-programs", TrainingProgramService.list);
export function useTrainingProgramMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["training-programs"] });
    return {
        create: useMutation({ mutationFn: (p: TrainingProgramPayload) => TrainingProgramService.create(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<TrainingProgramPayload> }) => TrainingProgramService.update(id, payload), onSuccess: invalidate }),
        remove: useMutation({ mutationFn: (id: string) => TrainingProgramService.remove(id), onSuccess: invalidate }),
    };
}

// --- Fee plans ---
export const useFeePlans = list("fee-plans", FeePlanService.list);
export function useFeePlanMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["fee-plans"] });
    return {
        create: useMutation({ mutationFn: (p: FeePlanPayload) => FeePlanService.create(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<FeePlanPayload> }) => FeePlanService.update(id, payload), onSuccess: invalidate }),
        remove: useMutation({ mutationFn: (id: string) => FeePlanService.remove(id), onSuccess: invalidate }),
    };
}

// --- Batches ---
export const useBatches = list("batches", BatchService.list);
export function useBatchMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["batches"] });
    return {
        create: useMutation({ mutationFn: (p: BatchPayload) => BatchService.create(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Partial<BatchPayload> }) => BatchService.update(id, payload), onSuccess: invalidate }),
        remove: useMutation({ mutationFn: (id: string) => BatchService.remove(id), onSuccess: invalidate }),
    };
}

// --- Enrollments ---
export const useEnrollments = list("enrollments", EnrollmentService.list);
export function useEnrollmentMutations() {
    const qc = useQueryClient();
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ["enrollments"] });
        qc.invalidateQueries({ queryKey: ["batches"] });
    };
    return {
        create: useMutation({ mutationFn: (p: EnrollmentPayload) => EnrollmentService.create(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: { status?: EnrollmentStatus; feePlanId?: string | null } }) => EnrollmentService.update(id, payload), onSuccess: invalidate }),
    };
}

// --- Attendance ---
export const useAttendance = list("attendance", AttendanceService.list);
export function useAttendanceSummary(params: { studentId?: string; batchId?: string; dateFrom?: string; dateTo?: string }, enabled = true) {
    return useQuery({ queryKey: ["attendance", "summary", params], queryFn: () => AttendanceService.summary(params), enabled });
}
export function useAttendanceMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["attendance"] });
    return {
        mark: useMutation({ mutationFn: (p: MarkAttendancePayload) => AttendanceService.mark(p), onSuccess: invalidate }),
        bulkMark: useMutation({ mutationFn: (p: Parameters<typeof AttendanceService.bulkMark>[0]) => AttendanceService.bulkMark(p), onSuccess: invalidate }),
        update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof AttendanceService.update>[1] }) => AttendanceService.update(id, payload), onSuccess: invalidate }),
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
export function useStudentFeeMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ["student-fees"] });
    return {
        create: useMutation({ mutationFn: (p: GenerateFeePayload) => StudentFeeService.create(p), onSuccess: invalidate }),
    };
}
