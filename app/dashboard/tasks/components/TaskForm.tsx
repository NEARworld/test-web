import React, { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MAX_FILE_SIZE } from "../utils/TaskUtils";

interface TaskFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  users: Pick<User, "id" | "name" | "image">[] | undefined;
  sessionUserId: string | undefined;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TaskForm({
  isDialogOpen,
  setIsDialogOpen,
  users,
  sessionUserId,
  setIsLoading,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 대화 상자가 열릴 때 현재 사용자를 담당자로 설정
  useEffect(() => {
    if (!isDialogOpen) {
      setTitle("");
      setAssignee("");
      setDueDate("");
      setDescription("");
      setSelectedFile(null);
    } else if (isDialogOpen && sessionUserId && users) {
      setAssignee(sessionUserId);
    }
  }, [isDialogOpen, sessionUserId, users]);

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
    if (!title || !assignee) return;

    setIsSubmitting(true);
    setIsDialogOpen(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("assignee", assignee);
    if (dueDate) {
      formData.append("dueDate", dueDate);
    }
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
        setIsLoading(true);
        toast.success("새로운 업무가 성공적으로 등록되었습니다.");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("업무 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer text-sm">
          <Plus className="mr-2 h-4 w-4" /> 업무 등록
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>새 업무 등록</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
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
              required
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
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="assignee" className="text-right text-sm">
              담당자
            </Label>
            <Select value={assignee} onValueChange={setAssignee} required>
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
              disabled={isSubmitting || !title || !assignee}
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
  );
}
