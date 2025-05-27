import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, User, Clock } from "lucide-react";
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

  // 날짜 포맷 함수
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                게시물
              </Badge>
              <DialogTitle className="text-2xl font-bold">
                {document.title || "제목 없음"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 메타 정보 섹션 */}
          <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>작성자: {document.createdById || "알 수 없음"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>작성일: {formatDate(document.createdAt)}</span>
            </div>
            {document.updatedAt &&
              document.updatedAt !== document.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>수정일: {formatDate(document.updatedAt)}</span>
                </div>
              )}
          </div>

          {/* 설명 섹션 */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">설명</h3>
            <div className="min-h-[100px] text-base whitespace-pre-line">
              {document.description || (
                <span className="text-muted-foreground italic">
                  설명이 없습니다.
                </span>
              )}
            </div>
          </div>

          {/* 첨부파일 섹션 */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">첨부파일</h3>
            {document.fileName && document.fileUrl ? (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <a
                  href={document.fileUrl}
                  download={document.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  <span className="max-w-[300px] truncate">
                    {document.fileName}
                  </span>
                </a>
              </Button>
            ) : (
              <span className="text-muted-foreground italic">
                첨부파일이 없습니다.
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
