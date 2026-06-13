-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "user_code_prefix" TEXT NOT NULL DEFAULT 'USR';
