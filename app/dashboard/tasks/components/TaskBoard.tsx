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
import {
  ChangeEvent,
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@prisma/client";
import { ExtendedTask } from "../page"; // Assuming ExtendedTask includes createdAt

interface TaskBoardProps {
  tasks: ExtendedTask[] | undefined;
  users: Pick<User, "id" | "name">[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
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
}: TaskBoardProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState(""); // Added description state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ExtendedTask>();

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

  if (isLoading && !tasks) {
    // Show loader only when initially loading or refetching fully
    return (
      <div className="flex flex-col items-center gap-2 p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">업무 불러오는 중...</p>
      </div>
    );
  }

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

        <DialogContent className="sm:max-w-[425px]">
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
                className="col-span-3 min-h-[80px]" // Adjusted textarea style
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

          <TableBody>
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow
                  className="hover:bg-muted/50 data-[state=selected]:bg-muted h-12 border-b transition-colors" // Standard hover style
                  key={task.id}
                  onClick={() => {
                    setCurrentTask(task);
                    setIsTaskViewOpen(true);
                  }}
                  style={{ cursor: "pointer" }} // Explicit cursor pointer
                >
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
              ))
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
        </Table>
      </div>

      {/* --- Task View Dialog --- */}
      <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentTask?.title ?? "업무 정보"}</DialogTitle>
            {/* Display Assignee and Dates in header subtitle */}
            <div className="text-muted-foreground space-y-1 pt-1 text-sm">
              {currentTask?.assignee && (
                <div>담당자: {currentTask.assignee.name ?? "미지정"}</div>
              )}
              <div>등록일: {formatDate(currentTask?.createdAt)}</div>
              <div>마감일: {formatDateWithWeekday(currentTask?.dueDate)}</div>
            </div>
          </DialogHeader>

          {/* Display Description */}
          <div className="py-4">
            <h4 className="mb-2 text-sm font-medium">설명</h4>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {" "}
              {/* Preserve whitespace/newlines */}
              {currentTask?.description
                ? currentTask.description
                : "설명이 없습니다."}
            </p>
          </div>

          <DialogFooter className="sm:justify-between">
            {" "}
            {/* Adjust footer layout */}
            {/* Optional: Add Edit/Delete buttons */}
            {/* <div>
                <Button variant="outline" size="sm" className="mr-2">수정</Button>
                <Button variant="destructive" size="sm">삭제</Button>
             </div> */}
            <Button
              variant="secondary"
              size="sm" // Consistent button size
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
