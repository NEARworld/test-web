/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "JobPosition" AS ENUM ('STAFF', 'SENIOR', 'MANAGER', 'DIRECTOR', 'EXECUTIVE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "hireDate" DATE,
ADD COLUMN     "position" "JobPosition" NOT NULL DEFAULT 'UNKNOWN';
