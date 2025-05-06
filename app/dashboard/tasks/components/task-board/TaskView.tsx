import React from "react";
import { Download, Eye, Loader2, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ExtendedTask } from "../../page";
import {
  formatDate,
  formatDateWithWeekday,
  getFileIcon,
  isImageFile,
  canEditTask,
} from "../../utils/TaskUtils";

interface TaskViewProps {
  isTaskViewOpen: boolean;
  setIsTaskViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentTask: ExtendedTask | undefined;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeleteConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handlePreview: (taskId: string, filename: string) => void;
  isEditing: boolean;
  isDeleting: boolean;
  sessionUserId: string | undefined;
  sessionUserRole: string | undefined;
}

export default function TaskView({
  isTaskViewOpen,
  setIsTaskViewOpen,
  currentTask,
  setIsEditDialogOpen,
  setIsDeleteConfirmOpen,
  handlePreview,
  isEditing,
  isDeleting,
  sessionUserId,
  sessionUserRole,
}: TaskViewProps) {
  // 현재 사용자가 작업을 수정할 수 있는지 확인
  const canEdit = canEditTask(currentTask, sessionUserId, sessionUserRole);

  return (
    <Dialog open={isTaskViewOpen} onOpenChange={setIsTaskViewOpen}>
      <DialogContent className="flex max-h-[85vh] min-h-[24rem] flex-col sm:max-w-md lg:max-w-2xl">
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
          <h4 className="mb-2 text-sm font-medium">설명</h4>
          <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
            {currentTask?.description
              ? currentTask.description
              : "설명이 없습니다."}
          </p>
        </div>
        {currentTask?.fileUrl && currentTask.fileName && (
          <div className="mt-2 flex items-center justify-between">
            <div className="w-[60%]">
              <div className="mb-2 flex items-center gap-1.5">
                <div className="shrink-0">
                  {getFileIcon(currentTask.fileName)}
                </div>
                <span className="text-sm text-nowrap">첨부 파일</span>
              </div>
              <span className="text-muted-foreground block overflow-hidden text-sm text-ellipsis">
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
            <div>
              작성자: {currentTask?.creator ? currentTask.creator.name : "-"}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditDialogOpen(true);
                  }}
                  disabled={isEditing || isDeleting}
                >
                  {isEditing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Edit className="mr-2 h-4 w-4" />
                  )}
                  수정
                </Button>
                <Button
                  variant={"outline"}
                  size="sm"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                  disabled={isEditing || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  삭제
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsTaskViewOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
