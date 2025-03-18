-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);
