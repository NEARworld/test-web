/*
  Warnings:

  - The values [SENIOR,MANAGER,DIRECTOR,EXECUTIVE] on the enum `JobPosition` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobPosition_new" AS ENUM ('STAFF', 'TEAM_LEADER', 'GENERAL_SECRETARY', 'CHAIRPERSON', 'CEO', 'UNKNOWN');
ALTER TABLE "User" ALTER COLUMN "position" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "position" TYPE "JobPosition_new" USING ("position"::text::"JobPosition_new");
ALTER TYPE "JobPosition" RENAME TO "JobPosition_old";
ALTER TYPE "JobPosition_new" RENAME TO "JobPosition";
DROP TYPE "JobPosition_old";
ALTER TABLE "User" ALTER COLUMN "position" SET DEFAULT 'UNKNOWN';
COMMIT;
