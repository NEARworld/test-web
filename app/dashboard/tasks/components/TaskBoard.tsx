"use client";

import {
  Loader2,
  Plus,
  Download,
  Eye,
  FileIcon,
  Image as ImageIcon,
  File,
  FileText,
  FileSpreadsheet,
  FilePen,
  Presentation,
  FileJson,
  FileCode,
  FileCog,
  Video,
  Music,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";

import { User } from "@prisma/client";
import { ExtendedTask } from "../page";

interface TaskBoardProps {
  tasks: ExtendedTask[] | undefined;
  users: Pick<User, "id" | "name" | "image">[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalTasks: number;
  itemsPerPage: number;
}

// 파일 크기 제한 상수 추가 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "날짜 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "날짜 형식 오류";
  }
};

const formatDateWithWeekday = (
  date: Date | string | undefined | null,
): string => {
  if (!date) return "날짜 없음";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date(date));
  } catch (error) {
    console.error("Error formatting date:", error);
    return "날짜 형식 오류";
  }
};

const DOTS = "...";

const getPaginationRange = (
  totalPages: number,
  currentPage: number,
  siblingCount = 1,
): (number | string)[] => {
  const totalPageNumbers = siblingCount + 5;

  if (totalPages <= totalPageNumbers) {
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i,
    );
    return [firstPageIndex, DOTS, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// 스켈레톤 UI 컴포넌트 추가
interface SkeletonProps {
  width: string;
  height: string;
  rounded?: boolean;
}

const Skeleton = ({ width, height, rounded = false }: SkeletonProps) => (
  <div
    className={`animate-pulse bg-gray-200 ${rounded ? "rounded-full" : "rounded"} ${width} ${height}`}
  />
);

export default function TaskBoard({
  tasks,
  users,
  isLoading,
  setIsLoading,
  totalTasks,
  itemsPerPage,
  currentPage,
  setCurrentPage,
}: TaskBoardProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ExtendedTask>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 초기 로딩 상태와 페이지 전환 로딩 상태 구분
  const isInitialLoading = isLoading && (!tasks || tasks.length === 0);
  const isPageTransitionLoading = isLoading && tasks && tasks.length > 0;

  // 조건부 렌더링 헬퍼 함수
  const renderContent = (
    isLoading: boolean,
    skeleton: ReactNode,
    content: ReactNode,
  ): ReactNode => {
    return isLoading ? skeleton : content;
  };

  // 업무 등록 대화 상자 초기화
  useEffect(() => {
    if (!isDialogOpen) {
      setTitle("");
      setAssignee("");
      setDueDate("");
      setDescription("");
      setSelectedFile(null);
    }
  }, [isDialogOpen]);

  // 페이지 전환 로딩 상태 관리
  useEffect(() => {
    if (isLoading) {
      setIsPageChanging(true);
    } else {
      const timer = setTimeout(() => {
        setIsPageChanging(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        toast.error("파일 크기는 10MB를 초과할 수 없습니다.");
        event.target.value = ""; // 파일 선택 초기화
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !assignee || !dueDate) return;

    setIsSubmitting(true);
    setIsDialogOpen(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("assignee", assignee);
    formData.append("dueDate", dueDate);
    if (description) {
      formData.append("description", description);
    }
    if (selectedFile) {
      formData.append("taskFile", selectedFile, selectedFile.name);
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "오류 응답 파싱 실패" }));
        console.error("Failed to create task:", response.status, errorData);
        toast.error(
          `업무 등록 실패: ${errorData.error || response.statusText}`,
        );
      } else {
        setIsLoading(true); // Trigger refetch in parent
        toast.success("새로운 업무가 성공적으로 등록되었습니다.");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("업무 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginationRange = getPaginationRange(totalPages, currentPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      setIsLoading(true);
      setIsPageChanging(true);
    }
  };

  // 이미지 파일인지 확인하는 함수
  const isImageFile = useCallback((filename: string): boolean => {
    if (!filename) return false;
    const fileExt = filename.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
      fileExt,
    );
  }, []);

  const handlePreview = async (taskId: string, filename: string) => {
    try {
      // 상태 초기화 후 로딩 시작
      setIsPreviewOpen(true);
      setIsPreviewLoading(true);
      setPreviewName(filename);

      // 파일 타입 확인
      const fileExt = filename.split(".").pop()?.toLowerCase() || "";
      const isImage = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "bmp",
        "tiff",
      ].includes(fileExt);
      const isPdf = fileExt === "pdf";
      const isText = ["txt", "md", "html", "css", "js", "ts", "json"].includes(
        fileExt,
      );

      // 10초 타임아웃 설정
      const timeoutId = setTimeout(() => {
        if (isPreviewLoading) {
          setIsPreviewLoading(false);
          toast.warning("파일 로딩 시간이 너무 오래 걸립니다.");
        }
      }, 10000);

      if (isImage || isPdf) {
        // 타입을 먼저 설정하고 URL은 나중에 설정
        setPreviewType(isImage ? "image" : "pdf");

        // 이미지는 미리 URL 설정하고, 실제 로드 완료 후 로딩 상태 해제
        const preloadUrl = `/api/tasks/download/${taskId}`;

        if (isImage) {
          const img = document.createElement("img");
          img.alt = filename || "이미지 미리보기";
          img.onload = () => {
            clearTimeout(timeoutId);
            setPreviewUrl(preloadUrl);
            setTimeout(() => setIsPreviewLoading(false), 100);
          };
          img.onerror = () => {
            clearTimeout(timeoutId);
            toast.error("이미지를 불러오는 중 오류가 발생했습니다.");
            setIsPreviewLoading(false);
          };
          img.src = preloadUrl;
        } else {
          // PDF는 URL 먼저 설정하고 짧은 로딩 시간 부여
          setPreviewUrl(preloadUrl);
          setTimeout(() => {
            clearTimeout(timeoutId);
            setIsPreviewLoading(false);
          }, 1500); // PDF는 iframe 로드 시간 고려하여 약간 더 긴 시간 부여
        }
      } else if (isText) {
        try {
          const response = await fetch(`/api/tasks/download/${taskId}`);
          if (!response.ok)
            throw new Error("텍스트 파일을 불러올 수 없습니다.");

          const text = await response.text();
          setPreviewType("text");
          setPreviewUrl(text);

          clearTimeout(timeoutId);
          setTimeout(() => setIsPreviewLoading(false), 100);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("텍스트 파일 로딩 오류:", error);
          toast.error("텍스트 파일을 불러오는 중 오류가 발생했습니다.");
          setIsPreviewLoading(false);
          setIsPreviewOpen(false);
        }
      } else {
        clearTimeout(timeoutId);
        toast.info(
          "이 파일 형식은 미리보기를 지원하지 않습니다. 다운로드하여 확인해주세요.",
        );
        setIsPreviewLoading(false);
        setIsPreviewOpen(false);
      }
    } catch (error) {
      console.error("파일 미리보기 오류:", error);
      toast.error("파일 미리보기를 불러오는 중 오류가 발생했습니다.");
      setIsPreviewLoading(false);
      setIsPreviewOpen(false);
    }
  };

  const getFileIcon = (filename: string) => {
    if (!filename) return <FileIcon className="h-4 w-4" />;

    const fileExt = filename.split(".").pop()?.toLowerCase() || "";

    // 이미지 파일
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
        fileExt,
      )
    ) {
      return <ImageIcon className="h-4 w-4" />;
    }
    // 엑셀 파일 (엑셀 아이콘으로 표시)
    else if (["xls", "xlsx", "csv", "xlsm", "xlt", "xltx"].includes(fileExt)) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    // 한글 문서
    else if (["hwp", "hwpx"].includes(fileExt)) {
      return <FilePen className="h-4 w-4 text-[#00a4ff]" />;
    }
    // 파워포인트 (프레젠테이션 아이콘으로 표시)
    else if (
      ["ppt", "pptx", "pptm", "pot", "potx", "pps", "ppsx"].includes(fileExt)
    ) {
      return <Presentation className="h-4 w-4 text-orange-600" />;
    }
    // 워드 문서
    else if (["doc", "docx", "docm", "rtf", "odt"].includes(fileExt)) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    // PDF 문서
    else if (["pdf"].includes(fileExt)) {
      return <FileText className="h-4 w-4 text-red-600" />;
    }
    // 동영상 파일
    else if (
      ["mp4", "avi", "mov", "wmv", "mkv", "flv", "webm"].includes(fileExt)
    ) {
      return <Video className="h-4 w-4" />;
    }
    // 오디오 파일
    else if (["mp3", "wav", "ogg", "flac", "aac"].includes(fileExt)) {
      return <Music className="h-4 w-4" />;
    }
    // 코드 파일
    else if (
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "html",
        "css",
        "py",
        "java",
        "c",
        "cpp",
      ].includes(fileExt)
    ) {
      return <FileCode className="h-4 w-4" />;
    } else if (
      ["json", "xml", "yaml", "yml", "toml", "ini", "conf"].includes(fileExt)
    ) {
      return <FileJson className="h-4 w-4" />;
    } else if (["exe", "dll", "bin", "sh", "bat", "cmd"].includes(fileExt)) {
      return <FileCog className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  return (
    <CardContent className="p-0">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="mb-4 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          {" "}
          <h1 className="text-2xl font-bold">업무 관리 대시보드</h1>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer text-sm">
              {" "}
              <Plus className="mr-2 h-4 w-4" /> 업무 등록
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-md lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>새 업무 등록</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
            {" "}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-sm">
                업무 제목
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 주간 보고서 작성"
                className="col-span-3"
                required // Added required attribute
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignee" className="text-right text-sm">
                담당자
              </Label>
              <Select value={assignee} onValueChange={setAssignee} required>
                {" "}
                <SelectTrigger id="assignee" className="col-span-3">
                  <SelectValue placeholder="담당자 선택">
                    {assignee && users ? (
                      (() => {
                        const selectedUser = users.find(
                          (user) => user.id === assignee,
                        );
                        return selectedUser ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              src={
                                typeof selectedUser.image === "string"
                                  ? selectedUser.image
                                  : undefined
                              }
                              name={selectedUser.name ?? ""}
                            />
                            <span>{selectedUser.name ?? "이름 없음"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserAvatar fallback="담" />
                            <span>담당자 선택</span>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserAvatar fallback="담" />
                        <span>담당자 선택</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={
                              typeof user.image === "string"
                                ? user.image
                                : undefined
                            }
                            name={user.name ?? ""}
                          />
                          <span>{user.name ?? "이름 없음"}</span>{" "}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-users" disabled>
                      사용자 정보 없음
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-sm">
                설명 (선택)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="업무에 대한 상세 내용을 입력하세요."
                className="col-span-3 min-h-60 lg:min-h-[250px]"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right text-sm">
                마감일
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskFile" className="text-right text-sm">
                파일 첨부 (선택)
              </Label>
              <div className="col-span-3">
                <Input
                  id="taskFile"
                  type="file"
                  onChange={handleFileChange}
                  className="file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 rounded-md file:border-0 file:p-4 file:px-4 file:py-2 file:text-sm file:font-semibold"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  최대 파일 크기: 10MB
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting || !title || !assignee || !dueDate}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                등록
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Task Table --- */}
      <div className="rounded-none border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted h-10 border-b">
              <TableHead className="text-muted-foreground w-[60px] px-3 py-2 text-center text-sm font-medium">
                번호
              </TableHead>
              <TableHead className="text-muted-foreground px-3 py-2 text-sm font-medium">
                업무 제목
              </TableHead>
              <TableHead className="text-muted-foreground px-3 py-2 text-right text-sm font-medium md:text-start">
                담당자
              </TableHead>
              <TableHead className="text-muted-foreground px-3 py-2 text-sm font-medium lg:table-cell">
                첨부 파일
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell">
                등록일
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell">
                마감일
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="relative">
            {/* ① 페이지 전환 중일 때: rows + 반투명 오버레이 + 스피너 */}
            {isPageTransitionLoading && (
              <div className="bg-background/70 absolute inset-0 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            )}

            {/* ② 첫 진입(데이터 전혀 없음)일 때만 '전체 스피너 행' */}
            {isInitialLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex h-60 flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      업무 불러오는 중...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : tasks && tasks.length > 0 ? (
              tasks.map((task, index) => {
                const itemNumber = totalTasks - startIndex - index;
                return (
                  <TableRow
                    className="hover:bg-muted/50 data-[state=selected]:bg-muted h-12 border-b transition-colors"
                    key={task.id}
                    onClick={() => {
                      setCurrentTask(task);
                      setIsTaskViewOpen(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell className="text-muted-foreground text-center text-sm">
                      {itemNumber}
                    </TableCell>
                    <TableCell className="w-1/2 max-w-xs truncate px-3 py-2 text-sm font-medium md:max-w-md lg:max-w-lg">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-3 py-2 text-right md:text-start md:text-sm">
                      <div className="flex items-center justify-end gap-1 md:justify-start">
                        {renderContent(
                          isPageChanging,
                          <Skeleton width="h-5" height="w-5" rounded />,
                          <UserAvatar
                            src={
                              task.assignee && "image" in task.assignee
                                ? typeof task.assignee.image === "string"
                                  ? task.assignee.image
                                  : undefined
                                : undefined
                            }
                            name={task.assignee?.name ?? ""}
                          />,
                        )}
                        {renderContent(
                          isPageChanging,
                          <Skeleton width="w-20" height="h-4" />,
                          <span>{task.assignee?.name ?? "미지정"}</span>,
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground px-3 py-2 text-sm lg:table-cell">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-16" height="h-4" />,
                        task.fileUrl && task.fileName ? (
                          <div className="flex items-center space-x-1">
                            {getFileIcon(task.fileName)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        ),
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-24" height="h-4" />,
                        formatDate(task.createdAt),
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-32" height="h-4" />,
                        formatDateWithWeekday(task.dueDate),
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                {/* Adjust colSpan if file header is added */}
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  등록된 업무가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-y-2 border-t px-4 py-3 sm:flex-row sm:gap-y-0">
          <div className="text-muted-foreground text-sm">
            총 {totalTasks}개 중 {startIndex + 1} - {endIndex} 표시 중 (페이지{" "}
            {currentPage}/{totalPages})
          </div>
          <Pagination>
            <PaginationContent>
              {/* 이전 페이지 버튼 */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* 페이지 번호 링크들 */}
              {paginationRange.map((page, index) => {
                if (page === DOTS) {
                  return (
                    <PaginationItem key={DOTS + index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page as number); // Type assertion
                      }}
                      isActive={page === currentPage}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* 다음 페이지 버튼 */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent className="flex max-h-[85vh] min-h-[24rem] flex-col sm:max-w-md lg:max-w-2xl">
          {" "}
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{currentTask?.title ?? "업무 정보"}</DialogTitle>
            <div className="text-muted-foreground pt-1 text-sm">
              {currentTask?.assignee && (
                <div className="flex items-center gap-1">
                  <UserAvatar
                    src={
                      currentTask.assignee && "image" in currentTask.assignee
                        ? typeof currentTask.assignee.image === "string"
                          ? currentTask.assignee.image
                          : undefined
                        : undefined
                    }
                    name={currentTask.assignee.name ?? ""}
                  />
                  <span>{currentTask.assignee.name ?? "미지정"}</span>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="my-4 flex-grow overflow-y-auto border-t border-b py-4">
            {" "}
            <h4 className="mb-2 text-sm font-medium">설명</h4>
            <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
              {currentTask?.description
                ? currentTask.description
                : "설명이 없습니다."}
            </p>
          </div>
          {currentTask?.fileUrl && currentTask.fileName && (
            <div className="mt-2 flex w-full items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="shrink-0">
                    {getFileIcon(currentTask.fileName)}
                  </div>
                  <span className="text-sm text-nowrap">첨부 파일</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {currentTask.fileName}
                </span>
              </div>
              <div className="flex gap-2">
                {currentTask.fileName && isImageFile(currentTask.fileName) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentTask.id && currentTask.fileName) {
                        handlePreview(currentTask.id, currentTask.fileName);
                      }
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                )}
                <a
                  href={`/api/tasks/download/${currentTask.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                  download
                >
                  <Download className="h-5 w-5" />
                </a>
              </div>
            </div>
          )}
          <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:flex sm:items-end sm:justify-between">
            <div className="text-muted-foreground mb-4 space-y-1 text-sm sm:mb-0">
              <div>등록일: {formatDate(currentTask?.createdAt)}</div>
              <div>마감일: {formatDateWithWeekday(currentTask?.dueDate)}</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsTaskViewOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] min-h-[24rem] flex-col sm:max-w-md md:max-w-2xl lg:max-w-4xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>파일 미리보기: {previewName}</DialogTitle>
          </DialogHeader>
          <div className="my-4 flex flex-grow items-center overflow-auto border-t border-b py-4">
            {isPreviewLoading ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  파일을 불러오는 중...
                </p>
              </div>
            ) : (
              <>
                {previewType === "image" && previewUrl && (
                  <div className="animate-in fade-in flex h-full items-center justify-center duration-200">
                    <Image
                      src={previewUrl}
                      alt={previewName || "이미지 미리보기"}
                      className="max-h-[70vh] max-w-full object-contain"
                      width={800}
                      height={600}
                      unoptimized
                    />
                  </div>
                )}
                {previewType === "pdf" && previewUrl && (
                  <div className="animate-in fade-in h-[70vh] w-full duration-200">
                    <iframe
                      src={`${previewUrl}#toolbar=0`}
                      className="h-full w-full"
                      title={previewName || "PDF 미리보기"}
                    />
                  </div>
                )}
                {previewType === "text" && previewUrl && (
                  <pre className="bg-muted/30 animate-in fade-in max-h-[70vh] w-full overflow-auto rounded-md p-4 text-sm whitespace-pre-wrap duration-200">
                    {previewUrl}
                  </pre>
                )}
              </>
            )}
          </div>
          <DialogFooter className="mt-auto flex-shrink-0 gap-2">
            {previewUrl && (
              <Button variant="default" size="sm" asChild>
                <a
                  href={
                    typeof previewUrl === "string" &&
                    previewUrl.startsWith("/api")
                      ? previewUrl
                      : "#"
                  }
                  download={previewName || undefined}
                >
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPreviewOpen(false);
                setTimeout(() => {
                  setPreviewUrl(null);
                  setPreviewType(null);
                  setPreviewName(null);
                  setIsPreviewLoading(false);
                }, 300); // 닫힘 애니메이션 후에 상태 리셋
              }}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}
