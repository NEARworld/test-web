/*
  Warnings:

  - The `status` column on the `ApprovalStep` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ApprovalStep" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ApprovalStepStatus";
