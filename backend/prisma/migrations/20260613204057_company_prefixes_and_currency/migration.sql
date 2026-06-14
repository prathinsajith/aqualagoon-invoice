-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "invoice_prefix" TEXT NOT NULL DEFAULT 'INV',
ADD COLUMN     "pass_prefix" TEXT NOT NULL DEFAULT 'PASS';
