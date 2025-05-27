import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Document } from "@prisma/client";

// BoardViewer 컴포넌트: 게시물 보기 모달
interface BoardViewerProps {
  open: boolean; // 모달 오픈 여부
  onOpenChange: (open: boolean) => void; // 모달 상태 변경 함수
  document: Document | null; // prisma Document 타입 사용
}

export default function BoardViewer({
  open,
  onOpenChange,
  document,
}: BoardViewerProps) {
  // document가 없으면 아무것도 렌더링하지 않음
  if (!document) return null;

  return (
    // shadcn Dialog 컴포넌트 사용
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{document.title || "제목 없음"}</DialogTitle>
          <DialogDescription>
            게시물의 상세 정보를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        {/* 게시물 상세 정보 표시 */}
        <div className="space-y-2 py-2">
          {/* 설명 */}
          <div>
            <span className="font-semibold">설명: </span>
            {document.description || "-"}
          </div>
          {/* 파일명 */}
          <div>
            <span className="font-semibold">파일명: </span>
            {document.fileName || "-"}
          </div>
          {/* 파일타입 */}
          <div>
            <span className="font-semibold">파일타입: </span>
            {document.fileType || "-"}
          </div>
          {/* 파일 URL */}
          <div>
            <span className="font-semibold">파일 URL: </span>
            {document.fileUrl ? (
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                다운로드
              </a>
            ) : (
              "-"
            )}
          </div>
          {/* 생성일 */}
          <div>
            <span className="font-semibold">생성일: </span>
            {document.createdAt
              ? new Date(document.createdAt).toLocaleString()
              : "-"}
          </div>
          {/* 게시판 타입 */}
          <div>
            <span className="font-semibold">게시판 타입: </span>
            {document.boardType || "-"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
