-- AlterTable
ALTER TABLE "enquiries" ADD COLUMN     "event_date" TIMESTAMP(3),
ADD COLUMN     "event_type" TEXT,
ADD COLUMN     "guests" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;
