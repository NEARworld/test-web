import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  User,
  Clock,
  Eye,
  Trash2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import type { Document } from "@prisma/client";
import { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// 허용되는 파일 확장자
const ALLOWED_FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "gif"];

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

  // 편집 모드 상태 추가
  const [isEditing, setIsEditing] = useState(false);
  // 수정 중인 데이터 상태 추가
  const [editData, setEditData] = useState<Partial<Document> | null>(null);
  // 수정 로딩 상태 추가
  const [updateLoading, setUpdateLoading] = useState(false);
  // 파일 업로드 상태
  const [file, setFile] = useState<File | null>(null);

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

  // 문서가 변경되면 편집 모드 초기화 및 editData 설정
  useEffect(() => {
    if (document) {
      setEditData(document);
      setIsEditing(false);
    } else {
      setEditData(null);
    }
  }, [document]);

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
    return ALLOWED_FILE_EXTENSIONS.includes(ext);
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

  // 수정 모드 전환 핸들러
  const handleEditMode = () => {
    setIsEditing(true);
    setPreviewOpen(false);
  };

  // 수정 취소 핸들러
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(document); // 원본 데이터로 복원
    setFile(null); // 파일 상태 초기화
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // 선택 필드 변경 핸들러
  const handleSelectChange = (name: string, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // 파일 변경 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewOpen(false);
    }
  };

  // 수정 저장 핸들러
  const handleSave = async () => {
    if (!document?.id || !editData) return;

    setUpdateLoading(true);

    try {
      // FormData 생성
      const formData = new FormData();

      // 기본 필드 추가
      formData.append("title", editData.title || "");
      formData.append("description", editData.description || "");
      formData.append("boardType", editData.boardType || "");

      // 새 파일이 있으면 추가
      if (file) {
        formData.append("file", file);
      }

      // API 호출
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "수정 중 오류가 발생했습니다.");
      }

      const updatedDocument = await response.json();
      toast.success("게시물이 수정되었습니다.");
      setIsEditing(false);
      // 문서 상태 업데이트
      if (updatedDocument) {
        // 부모 컴포넌트에서 document prop을 업데이트할 수 있도록 이벤트를 발생시키거나
        // 페이지를 새로고침하여 최신 데이터를 가져옵니다.
        router.refresh();
      }
    } catch (error) {
      console.error("수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "게시물 수정에 실패했습니다.",
      );
    } finally {
      setUpdateLoading(false);
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
            <DialogHeader className="w-full border-b pb-4">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="w-full">
                    <div className="mb-4">
                      <Select
                        value={editData?.boardType || ""}
                        onValueChange={(value) =>
                          handleSelectChange("boardType", value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="게시판 유형 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(boardTypeKo).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      name="title"
                      value={editData?.title || ""}
                      onChange={handleInputChange}
                      placeholder="제목"
                      className="text-xl font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {/* boardType을 한글로 표시, 없으면 '게시물' */}
                      {boardTypeKo[document.boardType] || "게시물"}
                    </Badge>
                    <DialogTitle className="text-2xl font-bold">
                      {document.title || "제목 없음"}
                    </DialogTitle>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="grid w-full gap-6 py-4">
              {/* 메타 정보 섹션 - 편집 모드에서는 표시하지 않음 */}
              {!isEditing && (
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
              )}

              {/* 설명 섹션 */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">설명</h3>
                {isEditing ? (
                  <Textarea
                    name="description"
                    value={editData?.description || ""}
                    onChange={handleInputChange}
                    placeholder="설명을 입력하세요"
                    className="min-h-[150px]"
                  />
                ) : (
                  <div className="min-h-[100px] text-base whitespace-pre-line">
                    {document.description || (
                      <span className="text-muted-foreground italic">
                        설명이 없습니다.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 첨부파일 섹션 */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">첨부파일</h3>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      accept={ALLOWED_FILE_EXTENSIONS.map(
                        (ext) => `.${ext}`,
                      ).join(",")}
                      onChange={handleFileChange}
                      className="max-w-md"
                    />
                    {file ? (
                      <p className="text-sm">선택된 파일: {file.name}</p>
                    ) : document.fileName ? (
                      <p className="text-sm">
                        현재 파일: {document.fileName} (변경하지 않으려면
                        비워두세요)
                      </p>
                    ) : null}
                  </div>
                ) : document.fileName && document.fileUrl ? (
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
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={handleSave}
                      className="flex items-center gap-2"
                      disabled={updateLoading}
                    >
                      <Save className="h-4 w-4" />
                      {updateLoading ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                  </div>
                ) : isAuthor ? (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="flex items-center gap-2"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteLoading ? "삭제 중..." : "삭제"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditMode}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      수정
                    </Button>
                  </div>
                ) : (
                  <div></div> // 작성자가 아닌 경우 빈 div로 레이아웃 유지
                )}
                {!isEditing && (
                  <Button onClick={() => onOpenChange(false)}>닫기</Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
