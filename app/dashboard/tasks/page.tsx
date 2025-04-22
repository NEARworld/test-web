"use client";

import { Card } from "@/components/ui/card";

import { useEffect, useState } from "react";

import { Task, User } from "@prisma/client";
import TaskBoard from "@/app/dashboard/tasks/components/TaskBoard";

export type ExtendedTask = Task & {
  assignee: { name: string; image?: string }; // 담당자 정보
  creator?: { id: string; name: string; image?: string } | null; // 작성자 정보
  fileUrl?: string | null; // 파일 공개 URL
  fileName?: string | null; // 원본 파일명
  fileType?: string | null; // 파일 MIME 타입
};

export default function TasksPage() {
  const [users, setUsers] = useState<Pick<User, "id" | "name" | "image">[]>();
  const [tasks, setTasks] = useState<ExtendedTask[]>();
  const [totalTasks, setTotalTasks] = useState<number>(0);

  const [isTaskLoading, setIsTaskLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const getUsers = async () => {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    };

    const getTasks = async () => {
      fetch(`/api/tasks?page=${currentPage}&limit=${itemsPerPage}`)
        .then((res) => res.json())
        .then((payload: { tasks: ExtendedTask[]; totalTasks: number }) => {
          setIsTaskLoading(false);
          setTasks(payload.tasks);
          setTotalTasks(payload.totalTasks);
        });
    };

    if (isTaskLoading) {
      getUsers();
      getTasks();
    }
  }, [isTaskLoading, currentPage]);

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
          totalTasks={totalTasks}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
        />
      </Card>
    </div>
  );
}
