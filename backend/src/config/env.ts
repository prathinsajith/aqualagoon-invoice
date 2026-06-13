import "dotenv/config";
import { z } from "zod";

/**
 * Runtime environment schema. Parsed once at startup so the process fails fast
 * with a readable message instead of throwing deep inside a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().min(1).default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8800),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Comma-separated list of allowed CORS origins.
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3300"),

  // --- Auth ---------------------------------------------------------------
  // Secrets for signing the short-lived access token and long-lived refresh
  // token. Keep them distinct so a leaked access secret can't mint refreshes.
  // At least 32 chars (256-bit) — required for HS256 signing with jose.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 chars"),
  // Lifetimes accepted by `@fastify/jwt` (`vercel/ms` format, e.g. "15m", "30d").
  JWT_ACCESS_TTL: z.string().min(1).default("15m"),
  JWT_REFRESH_TTL: z.string().min(1).default("30d"),
  JWT_RESET_TTL: z.string().min(1).default("30m"),

  // --- Uploads ------------------------------------------------------------
  // Directory (relative to the backend root) where profile photos are stored,
  // and the public base path they are served from.
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  UPLOAD_URL_PREFIX: z.string().min(1).default("/uploads"),
  // Absolute origin used to build returned photo URLs; falls back to the host.
  PUBLIC_URL: z.string().url().optional(),

  // --- Login rate limiting ------------------------------------------------
  LOGIN_RATE_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_WINDOW: z.string().min(1).default("1 minute"),

  // --- S3 storage (optional) ----------------------------------------------
  // When all four are present, uploads go to S3; otherwise they fall back to
  // local disk (served via @fastify/static at UPLOAD_URL_PREFIX).
  AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
  AWS_S3_BUCKET_REGION: z.string().min(1).optional(),
  AWS_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  // Optional CDN / custom-domain base for serving objects (no trailing slash).
  AWS_S3_PUBLIC_URL: z.url().optional(),

  // --- Frontend / links ---------------------------------------------------
  // Base URL of the frontend, used to build links inside emails (no trailing slash).
  FRONTEND_URL: z.string().url().default("http://localhost:3300"),

  // --- Email --------------------------------------------------------------
  // Two ways to configure sending (checked in this order):
  //   1. Generic SMTP — set SMTP_HOST (+ port/secure/user/pass). Works with any
  //      SMTP server, including Gmail (smtp.gmail.com) or Resend (smtp.resend.com).
  //   2. EMAIL_PROVIDER shortcut — "gmail" (GMAIL_USER/GMAIL_APP_PASSWORD) or
  //      "resend" (RESEND_API_KEY).
  // When neither is set, emails are logged to the console in dev (set
  // EMAIL_DEV_FALLBACK=true) so flows like password reset stay testable.
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Optional explicit "Name <addr>" sender. When unset it's composed from
  // EMAIL_FROM_NAME + EMAIL_FROM.
  MAIL_FROM: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.enum(["gmail", "resend"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("no-reply@aqualagoon.com"),
  EMAIL_FROM_NAME: z.string().min(1).default("Aqua Lagoon"),
  EMAIL_DEV_FALLBACK: z.stringbool().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

const hasS3 =
  !!data.AWS_S3_BUCKET_NAME &&
  !!data.AWS_S3_BUCKET_REGION &&
  !!data.AWS_S3_ACCESS_KEY_ID &&
  !!data.AWS_S3_SECRET_ACCESS_KEY;

const mailEnabled =
  !!data.SMTP_HOST ||
  (data.EMAIL_PROVIDER === "gmail" && !!data.GMAIL_USER && !!data.GMAIL_APP_PASSWORD) ||
  (data.EMAIL_PROVIDER === "resend" && !!data.RESEND_API_KEY);

export const env = {
  ...data,
  isProduction: data.NODE_ENV === "production",
  isDevelopment: data.NODE_ENV === "development",
  corsOrigins: data.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  storageDriver: hasS3 ? ("s3" as const) : ("local" as const),
  mailEnabled,
  // Explicit MAIL_FROM wins; otherwise compose "Name <addr>".
  mailFrom: data.MAIL_FROM ?? `${data.EMAIL_FROM_NAME} <${data.EMAIL_FROM}>`,
} as const;
