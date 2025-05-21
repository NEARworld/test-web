-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_isDeleted_idx" ON "Task"("isDeleted");
