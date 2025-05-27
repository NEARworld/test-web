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

export default function BoardViewer({ open, onOpenChange }: BoardViewerProps) {
  // 아직 실제 데이터 렌더링은 하지 않음
  return (
    // shadcn Dialog 컴포넌트 사용
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>게시물 상세 보기</DialogTitle>
          <DialogDescription>
            {/* 게시물 상세 정보가 여기에 표시될 예정 */}
          </DialogDescription>
        </DialogHeader>
        {/* 실제 데이터 렌더링은 다음 단계에서 구현 */}
      </DialogContent>
    </Dialog>
  );
}
