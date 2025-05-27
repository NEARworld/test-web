import { Skeleton } from "@/components/ui/skeleton";

// 스켈레톤 UI 컴포넌트
export default function BoardViewerSkeleton() {
  return (
    <div className="w-full">
      {/* 상단 헤더 스켈레톤 */}
      <div className="mb-6 border-b pb-4">
        <Skeleton className="mb-2 h-6 w-20" /> {/* Badge */}
        <Skeleton className="h-8 w-2/3" /> {/* Title */}
      </div>
      {/* 메타 정보 스켈레톤 */}
      <div className="mb-6 flex gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>
      {/* 설명 섹션 스켈레톤 */}
      <div className="mb-6 rounded-lg border p-4">
        <Skeleton className="mb-2 h-5 w-16" />
        <Skeleton className="h-20 w-full" />
      </div>
      {/* 첨부파일 섹션 스켈레톤 */}
      <div className="mb-6 rounded-lg border p-4">
        <Skeleton className="mb-2 h-5 w-16" />
        <Skeleton className="h-10 w-1/2" />
      </div>
      {/* 하단 버튼 스켈레톤 */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
