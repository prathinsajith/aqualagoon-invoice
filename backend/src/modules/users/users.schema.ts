import { z } from "zod";
import { paginationQuery } from "../../lib/pagination.js";

export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);

/** Minimal role reference embedded in a user. */
export const roleRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Public shape of a user returned to clients (never includes the password). */
export const userSchema = z.object({
  id: z.string(),
  userCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  gender: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  photoUrl: z.string().nullable(),
  address: z.string().nullable(),
  status: userStatusSchema,
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  roles: z.array(roleRefSchema),
});

export const createUserBody = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  // Optional: required only for login roles (enforced in the service). Customer
  // roles (Guest/Student) may be created without an email.
  email: z.email().max(255).nullish(),
  phone: z.string().trim().min(3).max(30).optional(),
  // Optional: when omitted, login users get a "set your password" email instead.
  password: z.string().min(8).max(128).optional(),
  gender: genderSchema.optional(),
  dateOfBirth: z.coerce.date().optional(),
  address: z.string().trim().max(500).optional(),
  status: userStatusSchema.default("ACTIVE"),
  roleIds: z.array(z.uuid()).default([]),
});

export const updateUserBody = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().max(255).nullable(),
    phone: z.string().trim().min(3).max(30).nullable(),
    password: z.string().min(8).max(128),
    gender: genderSchema.nullable(),
    dateOfBirth: z.coerce.date().nullable(),
    address: z.string().trim().max(500).nullable(),
    status: userStatusSchema,
    roleIds: z.array(z.uuid()),
  })
  .partial();

export const userIdParams = z.object({ id: z.uuid() });

export const listUsersQuery = paginationQuery.extend({
  status: userStatusSchema.optional(),
  roleId: z.uuid().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  includeDeleted: z.stringbool().default(false),
  onlyDeleted: z.stringbool().default(false),
  sortBy: z
    .enum(["createdAt", "firstName", "lastName", "email", "lastLoginAt"])
    .default("createdAt"),
});
