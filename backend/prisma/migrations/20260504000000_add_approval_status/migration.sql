-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Student" ADD COLUMN "submittedById" TEXT;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "MedicalRecord" ADD COLUMN "submittedById" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Appointment" ADD COLUMN "submittedById" TEXT;
