"use client";

import { User } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departmentLabels } from "@/constants/department";
import { jobPositionLabels } from "@/constants/jobPosition";
import { updateEmployeeDepartment, updateEmployeePosition } from "./actions";

// Helper function to format date
function formatDate(date: Date | null): string {
  if (!date) return "미지정";
  return date.toISOString().split("T")[0];
}

interface EmployeeTableProps {
  employees: User[];
  currentUserPosition: string;
}

export default function EmployeeTable({
  employees,
  currentUserPosition,
}: EmployeeTableProps) {
  // 접속 중인 사용자의 직급이 staff나 unknown이 아닌 경우에만 편집 가능
  const canEditEmployees = !["staff", "unknown"].includes(currentUserPosition);

  const handleDepartmentChange = async (
    employeeId: string,
    department: string,
  ) => {
    try {
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("department", department);

      await updateEmployeeDepartment(formData);
    } catch (error) {
      console.error("Failed to update department:", error);
    }
  };

  const handlePositionChange = async (employeeId: string, position: string) => {
    try {
      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("position", position);

      await updateEmployeePosition(formData);
    } catch (error) {
      console.error("Failed to update position:", error);
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>부서</TableHead>
            <TableHead>직급</TableHead>
            <TableHead className="hidden md:table-cell">입사일</TableHead>
            <TableHead>연락처</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>
                  {canEditEmployees ? (
                    <Select
                      defaultValue={employee.department}
                      onValueChange={(value) =>
                        handleDepartmentChange(employee.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(departmentLabels).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    departmentLabels[employee.department]
                  )}
                </TableCell>
                <TableCell>
                  {canEditEmployees ? (
                    <Select
                      defaultValue={employee.position}
                      onValueChange={(value) =>
                        handlePositionChange(employee.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="직급 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(jobPositionLabels).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    jobPositionLabels[employee.position]
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(employee.hireDate)}
                </TableCell>
                <TableCell>010-5555-5555</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                등록된 직원이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
