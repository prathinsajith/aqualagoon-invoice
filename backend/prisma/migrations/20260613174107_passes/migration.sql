-- CreateEnum
CREATE TYPE "PassKind" AS ENUM ('GUEST', 'STUDENT', 'VIP', 'FAMILY', 'CORPORATE');

-- CreateEnum
CREATE TYPE "PassDurationType" AS ENUM ('HOUR', 'DAY', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "PassEntryType" AS ENUM ('LIMITED', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "PassDiscountType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "UserPassStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "pass_types" (
    "id" TEXT NOT NULL,
    "type" "PassKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_type" "PassDurationType" NOT NULL,
    "duration_value" INTEGER NOT NULL,
    "entry_type" "PassEntryType" NOT NULL,
    "allowed_entries" INTEGER,
    "max_entries_per_day" INTEGER,
    "price" DECIMAL(12,2) NOT NULL,
    "discount_type" "PassDiscountType" NOT NULL DEFAULT 'NONE',
    "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pass_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_passes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "pass_type_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "pass_number" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "expiry_time" TIMESTAMP(3) NOT NULL,
    "original_price" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(12,2) NOT NULL,
    "remaining_entries" INTEGER,
    "status" "UserPassStatus" NOT NULL DEFAULT 'PENDING',
    "activated_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_usage_logs" (
    "id" TEXT NOT NULL,
    "user_pass_id" TEXT NOT NULL,
    "user_id" TEXT,
    "entry_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_renewals" (
    "id" TEXT NOT NULL,
    "user_pass_id" TEXT NOT NULL,
    "previous_expiry_time" TIMESTAMP(3) NOT NULL,
    "new_expiry_time" TIMESTAMP(3) NOT NULL,
    "renewed_by" TEXT,
    "renewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pass_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass_sequences" (
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pass_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE INDEX "pass_types_type_idx" ON "pass_types"("type");

-- CreateIndex
CREATE INDEX "pass_types_status_idx" ON "pass_types"("status");

-- CreateIndex
CREATE INDEX "pass_types_deleted_at_idx" ON "pass_types"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_passes_pass_number_key" ON "user_passes"("pass_number");

-- CreateIndex
CREATE INDEX "user_passes_user_id_idx" ON "user_passes"("user_id");

-- CreateIndex
CREATE INDEX "user_passes_pass_type_id_idx" ON "user_passes"("pass_type_id");

-- CreateIndex
CREATE INDEX "user_passes_invoice_id_idx" ON "user_passes"("invoice_id");

-- CreateIndex
CREATE INDEX "user_passes_status_idx" ON "user_passes"("status");

-- CreateIndex
CREATE INDEX "user_passes_expiry_time_idx" ON "user_passes"("expiry_time");

-- CreateIndex
CREATE INDEX "pass_usage_logs_user_pass_id_idx" ON "pass_usage_logs"("user_pass_id");

-- CreateIndex
CREATE INDEX "pass_usage_logs_entry_time_idx" ON "pass_usage_logs"("entry_time");

-- CreateIndex
CREATE INDEX "pass_renewals_user_pass_id_idx" ON "pass_renewals"("user_pass_id");

-- AddForeignKey
ALTER TABLE "user_passes" ADD CONSTRAINT "user_passes_pass_type_id_fkey" FOREIGN KEY ("pass_type_id") REFERENCES "pass_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_passes" ADD CONSTRAINT "user_passes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_passes" ADD CONSTRAINT "user_passes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_usage_logs" ADD CONSTRAINT "pass_usage_logs_user_pass_id_fkey" FOREIGN KEY ("user_pass_id") REFERENCES "user_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pass_renewals" ADD CONSTRAINT "pass_renewals_user_pass_id_fkey" FOREIGN KEY ("user_pass_id") REFERENCES "user_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
