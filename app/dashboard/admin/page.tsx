"use client";

import {
  convertUserDepartmentToKorean,
  convertUserJobPositionToKorean,
  getUserStatusKorean,
} from "@/lib/enum-converters";
import { User } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("직원 정보를 가져오는데 실패했습니다.");
        }
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>데이터 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">에러: {error}</p>
      </div>
    );
  }

  console.log(employees);

  return (
    <div className="min-h-screen px-8">
      <header className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-800">직원 관리</h1>
      </header>

      <div className="mb-6 flex space-x-3">
        <button className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-600">
          새 직원 추가
        </button>
        <button className="rounded-md border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 shadow-sm hover:bg-gray-100">
          보고서 생성
        </button>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="이름, 직책 또는 부서로 직원 검색"
            className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 transition duration-150 ease-in-out focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[180px]">이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  등록된 직원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee: User) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>
                    {convertUserJobPositionToKorean(employee.position)}
                  </TableCell>
                  <TableCell>
                    {convertUserDepartmentToKorean(employee.department)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getUserStatusKorean(employee.status).className}`}
                    >
                      {getUserStatusKorean(employee.status).text}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      수정
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
