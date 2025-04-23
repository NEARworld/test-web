-- CreateTable
CREATE TABLE "TaskModificationHistory" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedById" TEXT NOT NULL,
    "previousTitle" TEXT NOT NULL,
    "previousDescription" TEXT,
    "previousStatus" "TaskStatus" NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "previousAssigneeId" TEXT,
    "previousFileUrl" TEXT,
    "previousFileName" TEXT,
    "previousFileType" TEXT,
    "newTitle" TEXT NOT NULL,
    "newDescription" TEXT,
    "newStatus" "TaskStatus" NOT NULL,
    "newDueDate" TIMESTAMP(3),
    "newAssigneeId" TEXT,
    "newFileUrl" TEXT,
    "newFileName" TEXT,
    "newFileType" TEXT,

    CONSTRAINT "TaskModificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskModificationHistory_taskId_idx" ON "TaskModificationHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskModificationHistory_modifiedById_idx" ON "TaskModificationHistory"("modifiedById");

-- AddForeignKey
ALTER TABLE "TaskModificationHistory" ADD CONSTRAINT "TaskModificationHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskModificationHistory" ADD CONSTRAINT "TaskModificationHistory_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
