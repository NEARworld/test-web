"use client";

import React, { useEffect, useState, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import { User } from "@prisma/client";
import { ExtendedTask } from "../page";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import TaskForm from "./TaskForm";
import TaskTable from "./TaskTable";
import TaskView from "./TaskView";
import TaskEdit from "./TaskEdit";
import FilePreview from "./FilePreview";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

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
  const { data: session } = useSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<ExtendedTask | undefined>(
    undefined,
  );

  // 검색 관련 상태 추가
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<
    ExtendedTask[] | undefined
  >(tasks);
  const isInitialMount = useRef(true);

  // 페이지 전환 상태
  const [isPageChanging, setIsPageChanging] = useState(false);

  // 파일 미리보기 관련 상태
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // 작업 상태 관련
  const [isEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(totalTasks / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTasks);

  const isInitialLoading = isLoading && (!tasks || tasks.length === 0);

  // 페이지 전환 로딩 상태 관리
  useEffect(() => {
    if (isLoading) {
      setIsPageChanging(true);
    } else {
      const timer = setTimeout(() => setIsPageChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      setIsLoading(true);
      setIsPageChanging(true);
    }
  };

  // 파일 미리보기 처리 함수
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

  // 업무 삭제 처리 함수
  const handleDeleteTask = async () => {
    if (!currentTask?.id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDeleted: true,
        }),
      });

      console.log("업무 삭제 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: "오류 응답 파싱 실패" };
        }

        console.error("Failed to delete task:", response.status, errorData);
        toast.error(
          `업무 삭제 실패: ${errorData.error || response.statusText}`,
        );
      } else {
        setIsLoading(true);
        setIsDeleteConfirmOpen(false);
        setIsTaskViewOpen(false);
        toast.success("업무가 성공적으로 삭제되었습니다.");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("업무 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const changeInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue === "") {
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const triggerSearch = async () => {
      if (!searchTerm.trim()) {
        setFilteredTasks(tasks);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch(
          `/api/tasks/search?q=${encodeURIComponent(searchTerm)}`,
        );
        if (!response.ok) throw new Error("검색 중 오류가 발생했습니다");

        const data = await response.json();
        setFilteredTasks(data);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("검색 중 오류가 발생했습니다");
      } finally {
        setIsSearching(false);
      }
    };

    triggerSearch();
  }, [searchTerm, tasks]);

  return (
    <CardContent className="p-0">
      <div className="mb-4 block flex-row items-start justify-between sm:flex">
        <h1 className="mb-4 text-center text-2xl font-bold sm:mb-0 sm:text-left">
          업무 관리 대시보드
        </h1>

        <div className="flex flex-col-reverse items-end gap-4 sm:flex-row sm:items-center">
          <div className="relative mb-2 w-64 w-full sm:mb-0 md:w-80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearchTerm(inputValue);
              }}
            >
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="text"
                placeholder="업무 제목, 담당자 검색..."
                className="pr-4 pl-9 text-sm"
                value={inputValue}
                onChange={changeInputValue}
              />
              {isSearching && (
                <div className="absolute top-2.5 right-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </form>
          </div>

          <TaskForm
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            users={users}
            sessionUserId={session?.user?.id}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>

      <TaskTable
        initialTasks={filteredTasks}
        isInitialLoading={isInitialLoading}
        isPageChanging={isPageChanging}
        currentPage={currentPage}
        totalPages={totalPages}
        totalTasks={totalTasks}
        startIndex={startIndex}
        endIndex={endIndex}
        setCurrentTask={setCurrentTask}
        setIsTaskViewOpen={setIsTaskViewOpen}
        handlePageChange={handlePageChange}
      />

      <TaskView
        isTaskViewOpen={isTaskViewOpen}
        setIsTaskViewOpen={setIsTaskViewOpen}
        currentTask={currentTask}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        handlePreview={handlePreview}
        isEditing={isEditing}
        isDeleting={isDeleting}
        sessionUserId={session?.user?.id}
        sessionUserRole={session?.user?.role}
      />

      <TaskEdit
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setIsTaskViewOpen={setIsTaskViewOpen}
        currentTask={currentTask}
        users={users}
        setIsLoading={setIsLoading}
      />

      <FilePreview
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        previewUrl={previewUrl}
        previewType={previewType}
        previewName={previewName}
        isPreviewLoading={isPreviewLoading}
        setPreviewUrl={setPreviewUrl}
        setPreviewType={setPreviewType}
        setPreviewName={setPreviewName}
        setIsPreviewLoading={setIsPreviewLoading}
      />

      <DeleteConfirmDialog
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        handleDeleteTask={handleDeleteTask}
        isDeleting={isDeleting}
      />
    </CardContent>
  );
}
