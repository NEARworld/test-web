/*
  Warnings:

  - You are about to drop the column `newAssigneeId` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newDescription` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newDueDate` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newFileName` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newFileType` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newFileUrl` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newStatus` on the `TaskModificationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newTitle` on the `TaskModificationHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TaskModificationHistory" DROP COLUMN "newAssigneeId",
DROP COLUMN "newDescription",
DROP COLUMN "newDueDate",
DROP COLUMN "newFileName",
DROP COLUMN "newFileType",
DROP COLUMN "newFileUrl",
DROP COLUMN "newStatus",
DROP COLUMN "newTitle";
