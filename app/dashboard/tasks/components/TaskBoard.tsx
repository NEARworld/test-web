"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { FormEvent, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, User } from "@prisma/client";

interface TaskBoardProps {
  tasks: Task[] | undefined;
  users: Pick<User, "id" | "name">[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function TaskBoard({
  tasks,
  users,
  isLoading,
  setIsLoading,
}: TaskBoardProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setIsDialogOpen(false);
    setIsSubmitting(true);
    setIsLoading(true);

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, assignee, dueDate }),
    }).then(() => {
      setIsSubmitting(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">업무 불러오는 중</p>
      </div>
    );
  }

  return (
    <CardContent className="p-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">업무 목록</h2>
          <DialogTrigger asChild>
            <Button className="text-sm">업무 등록</Button>
          </DialogTrigger>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 업무 등록</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm">업무 제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 재고 점검"
              />
            </div>

            <div>
              <label className="text-sm">담당자</label>
              <Select onValueChange={setAssignee}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {users &&
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm">마감일</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={(!title || !assignee || !dueDate) && isSubmitting}
              >
                등록
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="px-2 py-1 text-sm">업무 제목</TableHead>
            <TableHead className="px-2 py-1 text-sm">담당자</TableHead>
            <TableHead className="px-2 py-1 text-sm">마감일</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tasks &&
            tasks.map((task) => (
              <TableRow className="h-8" key={task.id}>
                <TableCell className="px-2 py-1 text-sm">
                  {task.title}
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">
                  {task.assigneeId}
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">
                  {task.createdAt.toString()}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </CardContent>
  );
}
