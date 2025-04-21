-- CreateEnum
CREATE TYPE "Department" AS ENUM ('UNKNOWN', 'YOUTH_RESTAURANT', 'BAZAUL', 'FOOD_CARE_CENTER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" "Department" NOT NULL DEFAULT 'UNKNOWN';
