-- CreateEnum
CREATE TYPE "UserChangeType" AS ENUM ('POSITION_CHANGE', 'DEPARTMENT_CHANGE', 'ROLE_CHANGE', 'STATUS_CHANGE', 'OTHER');

-- CreateTable
CREATE TABLE "UserHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" "UserChangeType" NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" TEXT,
    "reason" TEXT,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
