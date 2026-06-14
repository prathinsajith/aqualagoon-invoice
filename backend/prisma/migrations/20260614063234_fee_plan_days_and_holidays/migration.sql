-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "holiday_dates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weekly_off_days" INTEGER[] DEFAULT ARRAY[0]::INTEGER[];

-- AlterTable
ALTER TABLE "fee_plans" ADD COLUMN     "duration_days" INTEGER NOT NULL DEFAULT 30;
