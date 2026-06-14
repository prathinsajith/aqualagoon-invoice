import { z } from "zod";
import { productStatusEnum } from "@/schemas/product";

const durationTypeEnum = z.enum(["MONTH", "QUARTER", "YEAR", "CUSTOM"]);
const batchStatusEnum = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]);

const optionalText = z.string().trim().max(1000).optional().or(z.literal(""));
const requiredAmount = z.number({ message: "Amount is required" }).min(0, "Cannot be negative");
const requiredCount = z.number({ message: "Required" }).int("Whole numbers only").positive("Must be at least 1");
const time = z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
    .optional()
    .or(z.literal(""));

export const trainingTypeFormSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    description: optionalText,
    status: productStatusEnum,
});
export type TrainingTypeFormSchema = z.infer<typeof trainingTypeFormSchema>;

export const trainingProgramFormSchema = z.object({
    trainingTypeId: z.string().min(1, "Training type is required"),
    name: z.string().trim().min(2, "Name is required").max(120),
    description: optionalText,
    durationType: durationTypeEnum,
    durationValue: requiredCount,
    defaultFee: requiredAmount,
    status: productStatusEnum,
});
export type TrainingProgramFormSchema = z.infer<typeof trainingProgramFormSchema>;

export const feePlanFormSchema = z.object({
    trainingProgramId: z.string().min(1, "Program is required"),
    name: z.string().trim().min(2, "Name is required").max(120),
    durationType: durationTypeEnum,
    durationDays: z.number().int().min(1, "At least 1 day").max(3650),
    amount: requiredAmount,
    description: optionalText,
    status: productStatusEnum,
});
export type FeePlanFormSchema = z.infer<typeof feePlanFormSchema>;

export const batchFormSchema = z.object({
    trainingProgramId: z.string().min(1, "Program is required"),
    trainerId: z.string().optional().or(z.literal("")),
    name: z.string().trim().min(2, "Name is required").max(120),
    startTime: time,
    endTime: time,
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    capacity: z.number().int("Whole numbers only").min(0, "Cannot be negative"),
    status: batchStatusEnum,
});
export type BatchFormSchema = z.infer<typeof batchFormSchema>;
