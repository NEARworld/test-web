-- AlterTable
ALTER TABLE "Task" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 이 마이그레이션은 Task 테이블에 createdById 컬럼을 추가하고 User 테이블과의 외래 키 관계를 설정합니다.
-- 이렇게 하면 각 태스크를 누가 생성했는지 추적할 수 있습니다. 