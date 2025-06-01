"use client";

import "react-day-picker/dist/style.css";

import React, { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { formatDate } from "@/app/dashboard/tasks/utils/TaskUtils";

interface EmployeeRowProps {
  employee: User;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => {
  const [hireDate, setHireDate] = useState<Date | undefined>(
    employee.hireDate ? new Date(employee.hireDate) : undefined,
  );
  const [resignationDate, setResignationDate] = useState<Date | undefined>(
    employee.resignationDate ? new Date(employee.resignationDate) : undefined,
  );
  const [openHireCalendar, setOpenHireCalendar] = useState(false);
  const [openResignationCalendar, setOpenResignationCalendar] = useState(false);

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
            <label htmlFor="hireDate" className="w-2/10 pr-4 text-left">
              입사일
            </label>
            <Popover open={openHireCalendar} onOpenChange={setOpenHireCalendar}>
              <PopoverTrigger asChild>
                <button className="w-3/4 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-gray-50">
                  {hireDate ? formatDate(hireDate) : "날짜 선택"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DayPicker
                  mode="single"
                  selected={hireDate}
                  onSelect={(date) => {
                    setHireDate(date);
                    setOpenHireCalendar(false);
                  }}
                  captionLayout="dropdown"
                  className="pointer-events-auto p-4"
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="resignationDate" className="w-2/10 pr-4 text-left">
              퇴사일
            </label>
            <Popover
              open={openResignationCalendar}
              onOpenChange={setOpenResignationCalendar}
            >
              <PopoverTrigger asChild>
                <button className="w-3/4 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-gray-50">
                  {resignationDate ? formatDate(resignationDate) : "날짜 선택"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DayPicker
                  mode="single"
                  selected={resignationDate}
                  onSelect={(date) => {
                    setResignationDate(date);
                    setOpenResignationCalendar(false);
                  }}
                  captionLayout="dropdown"
                  className="pointer-events-auto p-4"
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
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
        <DialogFooter className="justify-between sm:justify-between">
          <button
            onClick={() => {
              if (window.confirm("정말로 수정하시겠습니까?")) {
                // TODO: 실제 수정 로직을 여기에 추가하세요.
                console.log("수정 로직 실행");
              }
            }}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            수정
          </button>
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
