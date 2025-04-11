"use client";

import { Loader2 } from "lucide-react";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // 경로 확인
// --- ▲▲▲ Pagination 컴포넌트 import 추가 ▲▲▲ ---

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

  // --- 페이지네이션 계산 로직 (이전 단계에서 완료) ---
  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);
  // --- ---

  // Reset form fields when dialog closes or opens
  useEffect(() => {
    if (!isDialogOpen) {
      setTitle("");
      setAssignee("");
      setDueDate("");
      setDescription("");
    }
  }, [isDialogOpen]);

  // useEffect(() => {
  //   if (isTaskViewOpen) {
  //     // You might want to fetch detailed task info here if needed
  //   }
  // }, [isTaskViewOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !assignee || !dueDate) return; // Basic validation

    setIsSubmitting(true);
    setIsLoading(true); // Show loading indicator for the whole board
    setIsDialogOpen(false); // Close dialog immediately

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Include description in the body
        body: JSON.stringify({ title, assignee, dueDate, description }),
      });

      if (!response.ok) {
        // Handle error response from API
        console.error("Failed to create task:", await response.text());
        // Optionally show an error message to the user
      } else {
        // Task created successfully, data will be refetched by the parent page
        // because isLoading was set to true, triggering the parent's useEffect.
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      // Handle network or other errors
    } finally {
      // No need to set isSubmitting false here if isLoading handles UI state
      // setIsSubmitting(false); // Only needed if you have separate submit state indicator
      // setIsLoading(false); // The PARENT component should set this back to false after refetching
    }
  };

  // if (isLoading || !tasks) {
  //   // Show loader only when initially loading or refetching fully
  //   return (
  //     <div className="flex flex-col items-center gap-2 p-6">
  //       <Loader2 className="h-6 w-6 animate-spin" />
  //       <p className="text-muted-foreground text-sm">업무 불러오는 중...</p>
  //     </div>
  //   );
  // }

  return (
    <CardContent className="p-0">
      {/* --- Add Task Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="mb-4 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          {" "}
          {/* Added padding */}
          {/* <h2 className="text-lg font-semibold">업무 목록</h2> */}
          <h1 className="text-2xl font-bold">업무 관리 대시보드</h1>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer text-sm">
              {" "}
              {/* Adjusted button style */}
              <Plus className="mr-2 h-4 w-4" /> 업무 등록
            </Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-md lg:max-w-2xl">
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
                className="col-span-3 min-h-[100px] lg:min-h-[160px]" // Adjusted textarea style
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
      <div className="rounded-md border">
        {" "}
        {/* Added border around table */}
        <Table>
          <TableHeader>
            {/* Use bg-muted for header background */}
            <TableRow className="bg-muted hover:bg-muted h-10 border-b">
              <TableHead className="text-muted-foreground w-[60px] px-3 py-2 text-center text-sm font-medium">
                {" "}
                {/* 너비 지정 및 중앙 정렬 */}
                번호
              </TableHead>
              <TableHead className="text-muted-foreground px-3 py-2 text-sm font-medium">
                업무 제목
              </TableHead>
              <TableHead className="text-muted-foreground px-3 py-2 text-right text-sm font-medium md:text-start">
                담당자
              </TableHead>
              {/* 🔽 Added Header */}
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell">
                등록일
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell">
                마감일
              </TableHead>
              {/* Optional: Add Status Header */}
              {/* <TableHead className="w-[100px] px-3 py-2 text-sm font-medium text-muted-foreground">상태</TableHead> */}
              {/* Optional: Add Actions Header */}
              {/* <TableHead className="w-[80px] px-3 py-2 text-right text-sm font-medium text-muted-foreground">작업</TableHead> */}
            </TableRow>
          </TableHeader>

          {isLoading || !tasks ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      업무 불러오는 중...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="invisible">
                <TableCell className="text-muted-foreground text-center text-sm"></TableCell>
                <TableCell className="w-1/2 px-3 py-2 text-sm font-medium"></TableCell>
                <TableCell className="text-muted-foreground px-3 py-2 text-right md:text-start md:text-sm"></TableCell>
                <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                  {" "}
                  2025년 4월 11일
                </TableCell>
                <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                  2025년 4월 11일 금요일
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <></>
          )}
          {!isLoading && tasks && (
            <TableBody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task, index) => {
                  // 내림차순 번호 계산
                  // 전체 개수 - 현재 페이지 시작 인덱스 - 현재 페이지 내 순서
                  const itemNumber = totalTasks - startIndex - index;

                  return (
                    <TableRow
                      className="hover:bg-muted/50 data-[state=selected]:bg-muted h-12 border-b transition-colors" // Standard hover style
                      key={task.id}
                      onClick={() => {
                        setCurrentTask(task);
                        setIsTaskViewOpen(true);
                      }}
                      style={{ cursor: "pointer" }} // Explicit cursor pointer
                    >
                      {/* 새로운 '번호' TableCell 추가 */}
                      <TableCell className="text-muted-foreground text-center text-sm">
                        {" "}
                        {/* 중앙 정렬 */}
                        {itemNumber}
                      </TableCell>
                      <TableCell className="w-1/2 px-3 py-2 text-sm font-medium">
                        {" "}
                        {/* Adjusted padding/style */}
                        {task.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground px-3 py-2 text-right md:text-start md:text-sm">
                        {task.assignee?.name ?? "미지정"}{" "}
                        {/* Handle potential null assignee/name */}
                      </TableCell>
                      {/* 🔽 Added Cell for Creation Date */}
                      <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                        {formatDate(task.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell">
                        {formatDateWithWeekday(task.dueDate)}
                      </TableCell>
                      {/* Optional: Add Status Cell */}
                      {/* <TableCell className="px-3 py-2 text-sm">
                       <Badge variant={task.status === 'COMPLETED' ? 'success' : 'outline'}>
                           {task.status === 'COMPLETED' ? '완료' : '진행중'}
                       </Badge>
                    </TableCell> */}
                      {/* Optional: Add Actions Cell */}
                      {/* <TableCell className="px-3 py-2 text-right text-sm">
                        <TaskActions task={task} />
                     </TableCell> */}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground h-24 text-center"
                  >
                    {" "}
                    {/* Updated colSpan */}
                    등록된 업무가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>

      {/* --- ▼▼▼ 페이지네이션 컨트롤 수정 (shadcn/ui Pagination 사용) ▼▼▼ --- */}
      {totalPages > 0 &&
        totalTasks > itemsPerPage && ( // 표시 조건 유지
          <div className="mt-4 flex flex-col items-center justify-between gap-y-2 border-t px-4 py-3 sm:flex-row sm:gap-y-0">
            {" "}
            {/* 레이아웃 조정 */}
            {/* 페이지 정보 텍스트 (왼쪽 또는 상단) */}
            <div className="text-muted-foreground text-sm">
              총 {totalTasks}개 중 {startIndex + 1} - {endIndex} 표시 중
            </div>
            {/* shadcn Pagination 컴포넌트 (오른쪽 또는 하단) */}
            <Pagination>
              <PaginationContent>
                {/* 이전 페이지 버튼 */}
                <PaginationItem>
                  <PaginationPrevious
                    href="#" // 실제 링크 대신 onClick 사용
                    onClick={(e) => {
                      e.preventDefault(); // 기본 링크 동작 방지
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                        setIsLoading(true);
                      }
                    }}
                    //shadcn PaginationPrevious는 disabled 속성이 없으므로 스타일로 처리
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    aria-disabled={currentPage === 1} // 접근성 속성 추가
                  />
                </PaginationItem>

                {/* 페이지 번호 링크들 (간단 버전: 현재 페이지만 표시) */}
                {/* 필요시 여기에 페이지 번호들을 동적으로 생성하는 로직 추가 가능 */}
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {" "}
                    {/* 현재 페이지만 활성화 */}
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>

                {/* 페이지 번호가 많을 경우 생략 부호 (...) 표시 (선택 사항) */}
                {/* <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem> */}

                {/* 다음 페이지 버튼 */}
                <PaginationItem>
                  <PaginationNext
                    href="#" // 실제 링크 대신 onClick 사용
                    onClick={(e) => {
                      e.preventDefault(); // 기본 링크 동작 방지
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                        setIsLoading(true);
                      }
                    }}
                    // shadcn PaginationNext는 disabled 속성이 없으므로 스타일로 처리
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    aria-disabled={currentPage === totalPages} // 접근성 속성 추가
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

      {/* --- Task View Dialog --- */}
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        {/* You might want to adjust min-h-96 if the content now needs less forced height */}
        {/* Consider adding max-h-[85vh] overflow-y-auto if description can be very long */}
        <DialogContent className="flex min-h-[24rem] flex-col sm:max-w-md lg:max-w-2xl">
          {" "}
          {/* Use min-h value, flex-col helps footer stick to bottom */}
          {/* Header: Keep Title and Assignee */}
          <DialogHeader className="flex-shrink-0">
            {" "}
            {/* Prevent header from shrinking */}
            <DialogTitle>{currentTask?.title ?? "업무 정보"}</DialogTitle>
            <div className="text-muted-foreground pt-1 text-sm">
              {currentTask?.assignee && (
                <div>담당자: {currentTask.assignee.name ?? "미지정"}</div>
              )}
              {/* Dates removed from here */}
            </div>
          </DialogHeader>
          {/* Description: Allow this to grow and potentially scroll */}
          <div className="flex-grow overflow-y-auto py-4">
            {" "}
            {/* Allow div to grow and scroll if needed */}
            <h4 className="mb-2 text-sm font-medium">설명</h4>
            <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
              {currentTask?.description
                ? currentTask.description
                : "설명이 없습니다."}
            </p>
          </div>
          {/* Footer: Add Dates here, keep Close button */}
          <DialogFooter className="mt-auto flex-shrink-0 border-t pt-4 sm:flex sm:items-end sm:justify-between">
            {" "}
            {/* Add border, padding-top, make footer stick to bottom */}
            {/* Date Container */}
            <div className="text-muted-foreground mb-4 space-y-1 text-sm sm:mb-0">
              {" "}
              {/* Add bottom margin on small screens */}
              <div>등록일: {formatDate(currentTask?.createdAt)}</div>
              <div>마감일: {formatDateWithWeekday(currentTask?.dueDate)}</div>
            </div>
            {/* Close Button */}
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

// --- Additional imports needed for the enhanced version ---
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge"; // Needed if using Status column
// import { TaskActions } from "./task-actions"; // Needed if using Actions column

// --- Make sure your ExtendedTask type includes these fields ---
// Example definition (adjust based on your actual ../page file)
// import { Task, User } from "@prisma/client";
// export type ExtendedTask = Task & {
//   assignee: Pick<User, "id" | "name"> | null;
//   createdAt: Date; // Ensure this is included
//   description?: string | null; // Ensure this is included if used
//   status?: string; // Example for status column
// };
