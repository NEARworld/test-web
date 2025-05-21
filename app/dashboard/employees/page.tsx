"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { User } from "@prisma/client";
import { jobPositionLabels } from "@/constants/jobPosition";
import { departmentLabels } from "@/constants/department";
import { useSearch } from "@/app/hooks/useSearch";

function formatDate(date: Date | string | null): string {
  if (!date) return "미지정";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}

async function fetchInitialEmployees(): Promise<User[]> {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      throw new Error("Failed to fetch employees");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch initial employees:", error);
    return [];
  }
}

export default function EmployeesPage() {
  const [initialEmployees, setInitialEmployees] = useState<User[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [departmentFilter, _setDepartmentFilter] = useState<string>(""); // 부서 필터 상태
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [positionFilter, _setPositionFilter] = useState<string>(""); // 직급 필터 상태

  const {
    searchTerm,
    setSearchTerm,
    filteredData: filteredEmployees,
    isSearching,
    handleSearch,
  } = useSearch<User>(initialEmployees, "/api/users/search", {
    department: departmentFilter,
    position: positionFilter,
  });

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchInitialEmployees().then((data) => {
      setInitialEmployees(data);
    });
  }, []);

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="container mx-auto py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
      </div>

      {/* ---------------- 검색 & 필터 ---------------- */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
          <Input
            placeholder="직원 이름 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={isSearching}>
          {isSearching ? "검색 중..." : "검색"}
        </Button>
      </form>

      {/* ---------------- 직원 테이블 ---------------- */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>입사일</TableHead>
              <TableHead>연락처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  검색 중...
                </TableCell>
              </TableRow>
            ) : filteredEmployees && filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    {departmentLabels[employee.department] ?? "미지정"}
                  </TableCell>
                  <TableCell>
                    {jobPositionLabels[employee.position] ?? "미지정"}
                  </TableCell>
                  <TableCell>{formatDate(employee.hireDate)}</TableCell>
                  <TableCell>{employee.phone ?? "없음"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm || departmentFilter || positionFilter
                    ? "검색 결과가 없습니다."
                    : "등록된 직원이 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
