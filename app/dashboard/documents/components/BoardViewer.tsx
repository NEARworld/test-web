import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, User, Clock, Eye } from "lucide-react";
import type { Document } from "@prisma/client";
import { useState } from "react";
import Image from "next/image";

// BoardViewer 컴포넌트: 게시물 보기 모달
interface BoardViewerProps {
  open: boolean; // 모달 오픈 여부
  onOpenChange: (open: boolean) => void; // 모달 상태 변경 함수
  document: Document | null; // prisma Document 타입 사용
}

// boardType 한글 매핑
const boardTypeKo: Record<string, string> = {
  COMMUNITY: "공동모금회",
  FOODCARE: "먹거리돌봄",
  BAJAUL: "바자울",
  RESTAURANT: "청년식당",
  CORP: "이사회",
};

export default function BoardViewer({
  open,
  onOpenChange,
  document,
}: BoardViewerProps) {
  // 파일 미리보기 상태
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // 파일 확장자 확인
  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  // 미리보기 가능한 파일인지 확인
  const isPreviewable = (fileName: string) => {
    const ext = getFileExtension(fileName);
    return ["pdf", "jpg", "jpeg", "png", "gif"].includes(ext);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                {/* boardType을 한글로 표시, 없으면 '게시물' */}
                {boardTypeKo[document.boardType] || "게시물"}
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
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
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

                  {isPreviewable(document.fileName) && (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setPreviewOpen(!previewOpen)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>미리보기</span>
                    </Button>
                  )}
                </div>

                {/* 파일 미리보기 영역 */}
                {previewOpen && isPreviewable(document.fileName) && (
                  <div className="mt-2 w-full rounded-md border p-2">
                    {getFileExtension(document.fileName) === "pdf" ? (
                      <iframe
                        src={`${document.fileUrl}#view=FitH`}
                        className="h-[500px] w-full"
                        title={document.fileName}
                      />
                    ) : (
                      <Image
                        src={document.fileUrl}
                        alt={document.fileName}
                        width={800}
                        height={600}
                        className="mx-auto max-h-[500px] max-w-full object-contain"
                        unoptimized={!document.fileUrl.startsWith("/")}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">
                첨부파일이 없습니다.
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
