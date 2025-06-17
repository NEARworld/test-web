/*
  Warnings:

  - You are about to drop the column `completedAt` on the `ApprovalRequest` table. All the data in the column will be lost.
  - The `status` column on the `ApprovalRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `ApprovalStep` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `createdById` to the `ApprovalRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP COLUMN "completedAt",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "createdById" TEXT NOT NULL,
ALTER COLUMN "content" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ApprovalStep" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ApprovalRequestStatus";

-- CreateTable
CREATE TABLE "ApprovalAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalId" TEXT NOT NULL,

    CONSTRAINT "ApprovalAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,

    CONSTRAINT "ApprovalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalAttachment_approvalId_idx" ON "ApprovalAttachment"("approvalId");

-- CreateIndex
CREATE INDEX "ApprovalComment_approvalId_idx" ON "ApprovalComment"("approvalId");

-- CreateIndex
CREATE INDEX "ApprovalComment_createdById_idx" ON "ApprovalComment"("createdById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_createdById_idx" ON "ApprovalRequest"("createdById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_approvedById_idx" ON "ApprovalRequest"("approvedById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest"("requesterId");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAttachment" ADD CONSTRAINT "ApprovalAttachment_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalComment" ADD CONSTRAINT "ApprovalComment_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
