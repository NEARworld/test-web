import {
  convertUserDepartmentToKorean,
  convertUserJobPositionToKorean,
  getUserStatusKorean,
} from "@/lib/enum-converters";
import { User } from "@prisma/client";
import React from "react";
import { Badge } from "@/components/ui/badge";

// 예시 직원 데이터
const employeesData: Partial<User>[] = [
  {
    id: "1",
    name: "김민지",
    email: "minji@example.com",
    position: "STAFF",
    department: "BAZAUL",
  },
];

const EmployeeManagementPage: React.FC = () => {
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                이름
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                직책
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                부서
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                상태
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {employeesData.map((employee) => (
              <tr
                key={employee.id}
                className="transition-colors duration-150 hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                  {employee.name}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                  {convertUserJobPositionToKorean(employee.position)}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
                  {convertUserDepartmentToKorean(employee.department)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={`${getUserStatusKorean(employee.status).className}`}
                  >
                    {getUserStatusKorean(employee.status).text}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    수정
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
