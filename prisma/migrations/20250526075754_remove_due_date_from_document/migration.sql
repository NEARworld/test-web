/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `previousAssigneeId` on the `DocumentModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `previousDueDate` on the `DocumentModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `previousStatus` on the `DocumentModificationHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "dueDate";

-- AlterTable
ALTER TABLE "DocumentModificationHistory" DROP COLUMN "previousAssigneeId",
DROP COLUMN "previousDueDate",
DROP COLUMN "previousStatus";
