import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { UserAvatar } from "@/components/user-avatar";
import { ExtendedTask } from "../../page";
import { MAX_FILE_SIZE, getFileIcon } from "../../utils/TaskUtils";

interface TaskEditProps {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTaskViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentTask: ExtendedTask | undefined;
  users: Pick<User, "id" | "name" | "image">[] | undefined;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TaskEdit({
  isEditDialogOpen,
  setIsEditDialogOpen,
  setIsTaskViewOpen,
  currentTask,
  users,
  setIsLoading,
}: TaskEditProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [hasFileToUpload, setHasFileToUpload] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 대화 상자 초기화 및 업무 내용 채우기
  useEffect(() => {
    if (isEditDialogOpen && currentTask) {
      setEditTitle(currentTask.title);
      // ExtendedTask에서 assignee 정보 추출 - 타입 명시적 처리
      let assigneeId = "";
      if (
        currentTask.assignee &&
        typeof currentTask.assignee === "object" &&
        "id" in currentTask.assignee
      ) {
        assigneeId = currentTask.assignee.id as string;
      }
      setEditAssignee(assigneeId);
      setEditDueDate(
        currentTask.dueDate
          ? new Date(currentTask.dueDate).toISOString().split("T")[0]
          : "",
      );
      setEditDescription(currentTask.description || "");
      setHasFileToUpload(false);
    }
  }, [isEditDialogOpen, currentTask]);

  // 파일 변경 핸들러
  const handleEditFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        toast.error("파일 크기는 10MB를 초과할 수 없습니다.");
        event.target.value = ""; // 파일 선택 초기화
        setHasFileToUpload(false);
        return;
      }

      setHasFileToUpload(true);
    } else {
      setHasFileToUpload(false);
    }
  };

  // 수정 제출 핸들러
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editAssignee || !currentTask?.id) return;

    setIsEditing(true);

    try {
      const updateData = {
        title: editTitle,
        assigneeId: editAssignee,
        dueDate: editDueDate ? new Date(editDueDate) : null,
        description: editDescription || null,
      };

      // 파일 변경이 있는 경우 별도 처리 필요 (현재 API에서는 지원하지 않음)
      // 향후 파일 업로드를 위한 별도 API가 추가되어야 함
      if (hasFileToUpload) {
        console.log("파일 변경됨 - 아직 지원되지 않음");
      }

      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "오류 응답 파싱 실패" }));
        console.error("Failed to update task:", response.status, errorData);
        toast.error(
          `업무 수정 실패: ${errorData.error || response.statusText}`,
        );
      } else {
        setIsLoading(true);
        setIsEditDialogOpen(false);
        setIsTaskViewOpen(false);
        toast.success("업무가 성공적으로 수정되었습니다.");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("업무 수정 중 오류가 발생했습니다.");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-md lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>업무 수정</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleEditSubmit}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editTitle" className="text-right text-sm">
              업무 제목
            </Label>
            <Input
              id="editTitle"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="예: 주간 보고서 작성"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editDueDate" className="text-right text-sm">
              마감일
            </Label>
            <Input
              id="editDueDate"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editAssignee" className="text-right text-sm">
              담당자
            </Label>
            <Select
              value={editAssignee}
              onValueChange={setEditAssignee}
              required
            >
              <SelectTrigger id="editAssignee" className="col-span-3">
                <SelectValue placeholder="담당자 선택">
                  {editAssignee && users ? (
                    (() => {
                      const selectedUser = users.find(
                        (user) => user.id === editAssignee,
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
                        <span>{user.name ?? "이름 없음"}</span>
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
            <Label htmlFor="editDescription" className="text-right text-sm">
              설명 (선택)
            </Label>
            <Textarea
              id="editDescription"
              value={editDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setEditDescription(e.target.value)
              }
              placeholder="업무에 대한 상세 내용을 입력하세요."
              className="col-span-3 min-h-60 lg:min-h-[250px]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editTaskFile" className="text-right text-sm">
              파일 첨부 (선택)
            </Label>
            <div className="col-span-3">
              <Input
                id="editTaskFile"
                type="file"
                onChange={handleEditFileChange}
                className="file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 rounded-md file:border-0 file:p-4 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                최대 파일 크기: 10MB
              </p>
              {currentTask?.fileName && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    현재 파일:
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    {getFileIcon(currentTask.fileName)}
                    <span className="ml-1">{currentTask.fileName}</span>
                  </div>
                </div>
              )}
              {hasFileToUpload && (
                <p className="mt-1 text-xs text-blue-500">
                  * 새 파일이 선택되었습니다. (현재 API에서는 파일 업로드가
                  지원되지 않습니다)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isEditing || !editTitle || !editAssignee}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 수정 중
                </>
              ) : (
                "수정"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
