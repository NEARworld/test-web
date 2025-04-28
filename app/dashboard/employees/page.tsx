import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { User } from "@prisma/client";
import prisma from "@/lib/prisma";
import { jobPositionLabels } from "@/constants/jobPosition";
import { departmentLabels } from "@/constants/department";
import { auth } from "@/auth";
import EmployeeTable from "./EmployeeTable";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  // Fetch employee data from the database
  let employees: User[] = [];

  // Get the current user's position from the session
  const session = await auth();
  const currentUserPosition = session?.user?.position || "unknown";

  try {
    employees = await prisma.user.findMany({
      orderBy: {
        name: "asc", // Sort alphabetically by name
      },
    });
  } catch (error) {
    console.error("Database Error: Failed to fetch employees.", error);
  }

  return (
    <div className="container mx-auto py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
      </div>

      {/* 검색 & 필터 */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input placeholder="직원 검색..." className="pl-8" />
        </div>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="부서 선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(departmentLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="직급 선택" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(jobPositionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 직원 테이블 - 클라이언트 컴포넌트 */}
      <EmployeeTable
        employees={employees}
        currentUserPosition={currentUserPosition}
      />

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button variant="outline" size="sm">
          이전
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <Button variant="outline" size="sm">
          다음
        </Button>
      </div>
    </div>
  );
}
