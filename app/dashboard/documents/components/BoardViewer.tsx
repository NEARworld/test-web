import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, User, Clock, Eye, Trash2 } from "lucide-react";
import type { Document } from "@prisma/client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  // 유저 닉네임 상태 추가
  const [creatorName, setCreatorName] = useState<string | null>(null);
  // 로딩 상태 추가
  const [creatorLoading, setCreatorLoading] = useState(false);
  // 삭제 로딩 상태 추가
  const [deleteLoading, setDeleteLoading] = useState(false);
  // 현재 로그인한 사용자 정보 가져오기
  const { data: session } = useSession();
  // 라우터 추가
  const router = useRouter();

  // createdById로 유저 닉네임 조회
  useEffect(() => {
    if (!document?.createdById) {
      setCreatorName(null);
      setCreatorLoading(false);
      return;
    }
    setCreatorLoading(true);
    fetch(`/api/user?id=${document.createdById}`)
      .then((res) => res.json())
      .then((data) => setCreatorName(data?.name || null))
      .catch(() => setCreatorName(null))
      .finally(() => setCreatorLoading(false));
  }, [document?.createdById]);

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

  // 현재 사용자가 작성자인지 확인
  const isAuthor = session?.user?.id === document?.createdById;

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!document?.id) return;

    // 삭제 확인
    if (!confirm("정말로 이 게시물을 삭제하시겠습니까?")) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 중 오류가 발생했습니다.");
      }

      toast.success("게시물이 삭제되었습니다.");
      onOpenChange(false); // 모달 닫기
      router.refresh(); // 페이지 새로고침
    } catch (error) {
      console.error("삭제 오류:", error);
      toast.error("게시물 삭제에 실패했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex min-h-[300px] w-full max-w-3xl items-center justify-center">
        {/* 작성자 정보 로딩 중이면 전체 모달에 스켈레톤 표시 */}
        {creatorLoading ? (
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
        ) : (
          <>
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
                  <span>작성자: {creatorName || "알 수 없음"}</span>
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
              <div className="flex w-full items-center justify-between">
                {/* 작성자인 경우에만 삭제 버튼 표시 */}
                {isAuthor && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center gap-2"
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleteLoading ? "삭제 중..." : "삭제"}
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)}>닫기</Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
