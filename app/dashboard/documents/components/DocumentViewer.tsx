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
  Trash2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import type { Document, Attachment } from "@prisma/client";
import { useState, useEffect, ChangeEvent } from "react";
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
import { DocumentWithCreatedBy } from "@/types/document";
import { useDocument } from "@/hooks/useDocument";

// DocumentViewer 컴포넌트: 게시물 보기 모달
interface DocumentViewerProps {
  open: boolean; // 모달 오픈 여부
  onOpenChange: (open: boolean) => void; // 모달 상태 변경 함수
  document: DocumentWithCreatedBy | null; // prisma Document 타입 사용
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

export default function DocumentViewer({
  open,
  onOpenChange,
  document,
}: DocumentViewerProps) {
  const { fetchDocuments } = useDocument();
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
  const [files, setFiles] = useState<File[]>([]);

  // 문서가 변경되면 편집 모드 초기화 및 editData 설정
  useEffect(() => {
    if (document) {
      setEditData(document);
      setIsEditing(false);
    } else {
      setEditData(null);
    }
  }, [document]);

  // 파일명에서 숫자 타임스탬프 접두사를 제거하여 원본 파일 이름을 반환하는 함수
  const getOriginalFileName = (fileName: string): string => {
    let originalFileName = fileName;
    const hyphenIndex = fileName.indexOf("-");
    // 첫 번째 하이픈의 존재 여부 및 그 앞부분이 숫자로만 구성되었는지 확인
    if (hyphenIndex > 0 && /^\d+$/.test(fileName.substring(0, hyphenIndex))) {
      originalFileName = fileName.substring(hyphenIndex + 1);
    }
    return originalFileName;
  };

  // 파일명에서 확장자를 추출하는 함수
  const getFileExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    // 점이 없거나, 파일명의 맨 처음에 점이 있거나, 점 바로 뒤에 문자가 없는 경우 확장자가 없는 것으로 간주합니다.
    if (
      lastDotIndex === -1 ||
      lastDotIndex === 0 ||
      lastDotIndex === fileName.length - 1
    ) {
      return "";
    }
    return fileName.substring(lastDotIndex + 1).toLowerCase(); // 확장자는 소문자로 표시합니다.
  };

  // 파일 실제 다운로드 처리 함수
  const handleDownload = async (fileUrl: string, fileName: string) => {
    // 파일 URL이나 이름이 없는 경우 처리
    if (!fileUrl || !fileName) {
      toast.error("파일 정보가 유효하지 않아 다운로드할 수 없습니다.");
      return;
    }

    const originalFileName = getOriginalFileName(fileName);

    try {
      toast.info(`${originalFileName} 다운로드를 시작합니다...`);
      const response = await fetch(fileUrl);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("File fetch failed:", response.status, errorBody);
        // 파일을 가져오는데 실패했습니다.
        throw new Error(
          `파일을 가져오는데 실패했습니다: ${response.statusText} (상태: ${response.status})`,
        );
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a"); // window.document 사용
      link.href = url;
      // 다운로드 시 원본 파일 이름으로 저장되도록 link의 download 속성을 수정합니다.
      link.setAttribute("download", originalFileName); // 다운로드 파일명 설정
      window.document.body.appendChild(link); // window.document 사용 및 링크를 DOM에 추가
      link.click(); // 프로그래매틱 클릭으로 다운로드 트리거

      // 사용 후 DOM에서 링크 제거 및 Object URL 해제
      window.document.body.removeChild(link); // window.document 사용
      window.URL.revokeObjectURL(url);
    } catch (error: unknown) {
      // 타입을 unknown으로 변경
      console.error("Download error:", error);
      // 파일 다운로드 중 오류가 발생했습니다.
      if (error instanceof Error) {
        toast.error(error.message || "파일 다운로드 중 오류가 발생했습니다.");
      } else {
        toast.error("파일 다운로드 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

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
      fetchDocuments(); // 문서 목록 새로고침
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
  };

  // 수정 취소 핸들러
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(document); // 원본 데이터로 복원
    setFiles([]); // 파일 상태 초기화
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
    if (e.target.files) {
      setFiles(Array.from(e.target.files)); // 여러 파일 처리
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
      if (files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file); // "files" 이름으로 각 파일 추가
        });
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
        fetchDocuments(); // 문서 목록 새로고침
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
      <DialogContent className="flex max-h-[90vh] min-h-[300px] w-full max-w-3xl flex-col overflow-hidden p-0">
        <DialogHeader className="bg-background sticky top-0 z-10 w-full border-b px-6 pt-6 pb-4">
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
                <DialogTitle className="text-2xl font-bold">
                  <Input
                    name="title"
                    value={editData?.title || ""}
                    onChange={handleInputChange}
                    placeholder="제목"
                    className="text-xl font-bold"
                  />
                </DialogTitle>
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

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto px-6">
          <div className="grid w-full gap-6 py-4">
            {/* 메타 정보 섹션 - 편집 모드에서는 표시하지 않음 */}
            {!isEditing && (
              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    작성자: {document.createdBy?.name || "알 수 없음"}
                  </span>
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
                    multiple
                    accept={ALLOWED_FILE_EXTENSIONS.map(
                      (ext) => `.${ext}`,
                    ).join(",")}
                    onChange={handleFileChange}
                    className="max-w-md"
                  />
                  {files.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium">선택된 파일:</p>
                      <ul className="list-disc pl-5 text-sm">
                        {files.map((f, index) => (
                          <li key={index}>{f.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : document.attachments &&
                    document.attachments.length > 0 ? (
                    <div>
                      <p className="mb-2 text-sm font-medium">현재 파일:</p>
                      <div className="flex flex-col gap-3">
                        {(document.attachments as Attachment[]).map((df) => (
                          <div
                            key={df.id}
                            className="flex items-center justify-between rounded-md border p-3"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {getFileExtension(df.fileName) && (
                                <Badge
                                  variant="secondary"
                                  className="whitespace-nowrap"
                                >
                                  {getFileExtension(df.fileName)}
                                </Badge>
                              )}
                              <span className="truncate font-medium">
                                {getOriginalFileName(df.fileName)}
                              </span>
                            </div>
                            <button
                              type="button"
                              // onClick={() => handleDeleteExistingFile(df.id)} // 실제 삭제 로직은 추후 구현
                              className="p-1 text-red-500 hover:text-red-700"
                              aria-label={`Remove ${getOriginalFileName(df.fileName)}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-muted-foreground mt-2 text-xs">
                        (새 파일을 선택하면 모든 기존 파일이 교체됩니다. 파일을
                        유지하려면 비워두세요)
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : document.attachments && document.attachments.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {(document.attachments as Attachment[])?.map(
                    (docFile: Attachment) => (
                      <div
                        key={docFile.id}
                        className="flex flex-col gap-2 rounded-md border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {getFileExtension(docFile.fileName) && (
                              <Badge
                                variant="secondary"
                                className="whitespace-nowrap"
                              >
                                {getFileExtension(docFile.fileName)}
                              </Badge>
                            )}
                            <span className="max-w-[260px] truncate font-medium">
                              {getOriginalFileName(docFile.fileName)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5"
                              onClick={() =>
                                handleDownload(
                                  docFile.fileUrl,
                                  docFile.fileName,
                                )
                              }
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>다운로드</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  첨부파일이 없습니다.
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-background sticky bottom-0 z-10 w-full border-t px-6 pt-4 pb-6">
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
      </DialogContent>
    </Dialog>
  );
}
