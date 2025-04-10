"use client";

import { BarChart3, CalendarCheck2, ClipboardList, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useEffect, useState } from "react";

import { Task, User } from "@prisma/client";
import { TaskBoard } from "./components/TaskBoard";

export type ExtendedTask = Task & { assignee: { name: string } };

export default function TasksPage() {
  const [users, setUsers] = useState<Pick<User, "id" | "name">[]>();
  const [tasks, setTasks] = useState<ExtendedTask[]>();

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

    if (isTaskLoading) {
      getUsers();
      getTasks();
    }
  }, [isTaskLoading]);

  return (
    <div className="space-y-6 p-6">
      {/* 위젯들 */}
      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div> */}

      {/* 아래쪽 영역: 예약 리스트, 재고 상태 등 추가 가능 */}
      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      </div> */}

      <Card className="rounded-none p-0">
        <TaskBoard
          isLoading={isTaskLoading}
          setIsLoading={setIsTaskLoading}
          tasks={tasks}
          users={users}
        />
      </Card>
    </div>
  );
}
