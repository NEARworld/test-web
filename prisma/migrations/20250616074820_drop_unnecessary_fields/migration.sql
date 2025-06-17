/*
  Warnings:

  - You are about to drop the column `requesterId` on the `ApprovalRequest` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `ApprovalStep` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApprovalRequest" DROP CONSTRAINT "ApprovalRequest_requesterId_fkey";

-- DropIndex
DROP INDEX "ApprovalRequest_requesterId_idx";

-- AlterTable
ALTER TABLE "ApprovalRequest" DROP COLUMN "requesterId";

-- AlterTable
ALTER TABLE "ApprovalStep" DROP COLUMN "comment";
