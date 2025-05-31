"use client";

import React from "react";
import { User } from "@prisma/client";
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
          <DialogTitle>{employee.name}</DialogTitle>
        </DialogHeader>
        <div>
          <p>이메일: {employee.email}</p>
          <p>직책: {convertUserJobPositionToKorean(employee.position)}</p>
          <p>부서: {convertUserDepartmentToKorean(employee.department)}</p>
          <p>상태: {getUserStatusKorean(employee.status).text}</p>
          {/* 여기에 추가적인 직원 정보를 표시할 수 있습니다. */}
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
