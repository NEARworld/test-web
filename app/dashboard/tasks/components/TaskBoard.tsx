"use client";

import { Loader2, Plus } from "lucide-react"; // Added Plus import back
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
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- ▼▼▼ Pagination 컴포넌트 import 추가 ▼▼▼ ---
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis, // Import PaginationEllipsis
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // 경로 확인
// --- ▲▲▲ Pagination 컴포넌트 import 추가 ▲▲▲ ---
import { Label } from "@/components/ui/label"; // Added Label import back
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import back
import { toast } from "sonner"; // Added toast import back

import { User } from "@prisma/client";
import { ExtendedTask } from "../page"; // Assuming ExtendedTask includes createdAt

interface TaskBoardProps {
  tasks: ExtendedTask[] | undefined;
  users: Pick<User, "id" | "name">[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalTasks: number;
  itemsPerPage: number;
}

// Helper function for date formatting (optional, but good for DRY)
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

// --- ▼▼▼ Pagination Range Helper Function ▼▼▼ ---
const DOTS = "...";

const getPaginationRange = (
  totalPages: number,
  currentPage: number,
  siblingCount = 1, // Number of pages to show on each side of the current page
): (number | string)[] => {
  const totalPageNumbers = siblingCount + 5; // siblingCount + firstPage + lastPage + currentPage + 2*DOTS

  /*
    Case 1:
    If the number of pages is less than the page numbers we want to show in our
    paginationComponent, we return the range [1..totalPages]
  */
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  /*
    We do not show dots just when there is just one page number to be inserted between
    the extremes of sibling and the page limits i.e 1 and totalPages.
    Hence, we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPages - 1
  */
  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  /*
    Case 2: No left dots to show, but rights dots to be shown
  */
  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  /*
    Case 3: No right dots to show, but left dots to be shown
  */
  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + 1 + i,
    );
    return [firstPageIndex, DOTS, ...rightRange];
  }

  /*
    Case 4: Both left and right dots to be shown
  */
  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
  }

  // Default fallback (should be covered by case 1)
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};
// --- ▲▲▲ Pagination Range Helper Function ▲▲▲ ---

export function TaskBoard({
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
  const [description, setDescription] = useState(""); // Added description state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ExtendedTask>();

  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- ▼▼▼ 로딩 상태 구분 변수 추가 ▼▼▼ ---
  // isLoading이 true이고, tasks 데이터가 아직 없거나 비어있으면 초기 로딩
  const isInitialLoading = isLoading && (!tasks || tasks.length === 0);

  // isLoading이 true이지만, tasks 데이터가 이미 존재하면 페이지 전환 로딩
  const isPageTransitionLoading = isLoading && tasks && tasks.length > 0;
  // --- ▲▲▲ 로딩 상태 구분 변수 추가 ▲▲▲ ---

  useEffect(() => {
    if (!isDialogOpen) {
      setTitle("");
      setAssignee("");
      setDueDate("");
      setDescription("");
      setSelectedFile(null);
    }
  }, [isDialogOpen]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
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
      // No need to set isLoading(false) here, parent will do it after fetch
    }
  };

  // --- ▼▼▼ 페이지네이션 번호 계산 ▼▼▼ ---
  const paginationRange = getPaginationRange(totalPages, currentPage);
  // --- ▲▲▲ 페이지네이션 번호 계산 ▲▲▲ ---

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      setIsLoading(true); // Trigger loading state for data refetch
    }
  };

  return (
    <CardContent className="p-0">
      {/* --- Add Task Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="mb-4 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          {" "}
          {/* Added padding */}
          <h1 className="text-2xl font-bold">업무 관리 대시보드</h1>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer text-sm">
              {" "}
              {/* Adjusted button style */}
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
            {/* Use grid layout */}
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
                {/* Added required */}
                <SelectTrigger id="assignee" className="col-span-3">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name ?? "이름 없음"}{" "}
                        {/* Handle potential null names */}
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
            {/* Added Description Field */}
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
                className="col-span-3 min-h-60 lg:min-h-[250px]" // Adjusted textarea style
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
                required // Added required attribute
              />
            </div>
            {/* --- ▼▼▼ 파일 첨부 필드 추가 ▼▼▼ --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskFile" className="text-right text-sm">
                파일 첨부 (선택)
              </Label>
              {/* shadcn/ui의 Input 컴포넌트를 type="file"로 사용 */}
              <Input
                id="taskFile"
                type="file"
                onChange={handleFileChange} // Updated onChange handler
                className="file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 col-span-3 rounded-md file:border-0 file:p-4 file:px-4 file:py-2 file:text-sm file:font-semibold" // 기본 스타일링 예시
              />
            </div>
            {/* --- ▲▲▲ 파일 첨부 필드 추가 ▲▲▲ --- */}
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
              {/* ▼▼▼ 첨부 파일 헤더 추가 (선택 사항) ▼▼▼ */}
              {/* Note: You'll need to add a corresponding TableCell below if you display file info */}
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium lg:table-cell">
                첨부 파일
              </TableHead>
              {/* ▲▲▲ 첨부 파일 헤더 추가 ▲▲▲ */}
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

            {/* ② 첫 진입(데이터 전혀 없음)일 때만 ‘전체 스피너 행’ */}
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
                      {task.assignee?.name ?? "미지정"}
                    </TableCell>
                    {/* ▲▲▲ Add Cell for Attachment Info ▲▲▲ */}
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                      {formatDate(task.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                      {formatDateWithWeekday(task.dueDate)}
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

      {/* --- ▼▼▼ 페이지네이션 컨트롤 수정 (shadcn/ui Pagination + Page Numbers) ▼▼▼ --- */}
      {totalPages > 1 && ( // Show only if more than one page
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
      {/* --- ▲▲▲ 페이지네이션 컨트롤 수정 ▲▲▲ --- */}

      {/* --- Task View Dialog --- */}
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent className="flex max-h-[85vh] min-h-[24rem] flex-col sm:max-w-md lg:max-w-2xl">
          {" "}
          {/* Added max-height */}
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{currentTask?.title ?? "업무 정보"}</DialogTitle>
            <div className="text-muted-foreground pt-1 text-sm">
              {currentTask?.assignee && (
                <div>담당자: {currentTask.assignee.name ?? "미지정"}</div>
              )}
              {/* Display attachment link if file exists */}
              {/* {currentTask?.filePath && (
                  <div className="mt-1">
                      첨부 파일: {' '}
                       <a
                          href={`/api/tasks/download/${currentTask.id}`} // Use the same download link
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {currentTask.filePath.split('/').pop() || "파일 다운로드"}
                        </a>
                  </div> */}
              {/* )} */}
            </div>
          </DialogHeader>
          <div className="my-4 flex-grow overflow-y-auto border-t border-b py-4">
            {" "}
            {/* Added borders and margin */}
            <h4 className="mb-2 text-sm font-medium">설명</h4>
            <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
              {currentTask?.description
                ? currentTask.description
                : "설명이 없습니다."}
            </p>
          </div>
          <DialogFooter className="mt-auto flex-shrink-0 pt-4 sm:flex sm:items-end sm:justify-between">
            <div className="text-muted-foreground mb-4 space-y-1 text-sm sm:mb-0">
              <div>등록일: {formatDate(currentTask?.createdAt)}</div>
              <div>마감일: {formatDateWithWeekday(currentTask?.dueDate)}</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTaskViewOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

// Assume ExtendedTask might look like this (adjust based on your actual type)
// export type ExtendedTask = Task & {
//   assignee: Pick<User, "id" | "name"> | null;
//   createdAt: Date;
//   description?: string | null;
//   dueDate: Date | null; // Ensure this matches Prisma schema
//   filePath?: string | null; // Added for file path
// };
