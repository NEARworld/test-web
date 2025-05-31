"use client";

import React from "react";
import { User, JobPosition, Department, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  convertUserDepartmentToKorean,
  convertUserJobPositionToKorean,
  getUserStatusKorean,
} from "@/lib/enum-converters";

interface EmployeeRowProps {
  employee: User;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => {
  // 각 행이 자신의 Dialog 상태를 관리하므로 별도의 selectedEmployee 상태가 EmployeeManagementPage에 필요 없습니다.
  return (
    <Dialog>
      <DialogTrigger asChild>
        <TableRow className="hover:cursor-pointer">
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
        </TableRow>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <p className="text-sm text-gray-500">
            선택한 직원의 세부 정보를 업데이트합니다.
          </p>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="w-1/10 pr-4 text-right">
              이름
            </label>
            <input
              id="name"
              defaultValue={employee.name ?? ""}
              className="w-3/4 rounded-md border border-gray-300 p-2"
              readOnly
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="position" className="w-1/10 pr-4 text-right">
              직책
            </label>
            <Select defaultValue={employee.position}>
              <SelectTrigger className="w-3/4 text-base">
                <SelectValue placeholder="직책 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(JobPosition).map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {convertUserJobPositionToKorean(pos)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="department" className="w-1/10 pr-4 text-right">
              부서
            </label>
            <Select defaultValue={employee.department}>
              <SelectTrigger className="w-3/4 text-base">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Department).map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {convertUserDepartmentToKorean(dept)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="w-1/10 pr-4 text-right">
              상태
            </label>
            <Select defaultValue={employee.status}>
              <SelectTrigger className="w-3/4 text-base">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getUserStatusKorean(status).text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="rounded bg-gray-200 px-4 py-2 text-black hover:bg-gray-300">
              닫기
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeRow;
