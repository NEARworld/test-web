"use client";

import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  Loader,
  Loader2,
  Users,
} from "lucide-react";
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
import { FormEvent, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, User } from "@prisma/client";

export default function TasksPage() {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [users, setUsers] = useState<Pick<User, "id" | "name">[]>();
  const [tasks, setTasks] = useState<Task[]>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      const res = await fetch("/api/users");
      setUsers(await res.json());
    };
    const getTasks = async () => {
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((tasks) => {
          setIsTaskLoading(false);
          setTasks(tasks);
        });
    };

    getUsers();
    getTasks();
  }, []);

  console.log(tasks);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    setIsDialogOpen(false);
    setIsSubmitting(true);

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, assignee, dueDate }),
    }).then(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">업무 관리 대시보드</h1>

      {/* 위젯들 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CalendarCheck2 className="h-6 w-6" />
            <div>
              <p className="text-muted-foreground text-sm">오늘 예약 수</p>
              <p className="text-lg font-semibold">23건</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <ClipboardList className="h-6 w-6" />
            <div>
              <p className="text-muted-foreground text-sm">처리된 업무</p>
              <p className="text-lg font-semibold">17건</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-6 w-6" />
            <div>
              <p className="text-muted-foreground text-sm">신규 고객</p>
              <p className="text-lg font-semibold">5명</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <BarChart3 className="h-6 w-6" />
            <div>
              <p className="text-muted-foreground text-sm">예약 증가율</p>
              <p className="text-lg font-semibold">+12%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 아래쪽 영역: 예약 리스트, 재고 상태 등 추가 가능 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-lg font-semibold">최근 예약</h2>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>김민수 - 2명 - 오후 6시</li>
              <li>이영희 - 4명 - 오후 7시</li>
              <li>박지훈 - 3명 - 오후 8시</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-lg font-semibold">재고 상태</h2>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>돼지고기 - 충분</li>
              <li>쌀 - 부족</li>
              <li>양배추 - 적정</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          {isTaskLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">업무 불러오는 중</p>
            </div>
          ) : (
            <>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">업무 목록</h2>
                  <DialogTrigger asChild>
                    <Button
                      className="text-sm"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      업무 등록
                    </Button>
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
                        disabled={
                          (!title || !assignee || !dueDate) && isSubmitting
                        }
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
                    {/* 행 높이 줄이기 */}
                    <TableHead className="px-2 py-1 text-sm">
                      업무 제목
                    </TableHead>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
