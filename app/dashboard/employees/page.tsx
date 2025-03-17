import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Search } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="container mx-auto py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          직원 추가
        </Button>
      </div>

      {/* 검색 및 필터 */}
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
            <SelectItem value="all">전체 부서</SelectItem>
            <SelectItem value="dev">개발팀</SelectItem>
            <SelectItem value="sales">영업팀</SelectItem>
            <SelectItem value="hr">인사팀</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="직급 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 직급</SelectItem>
            <SelectItem value="staff">사원</SelectItem>
            <SelectItem value="senior">대리</SelectItem>
            <SelectItem value="manager">과장</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 직원 테이블 */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>사번</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>입사일</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>홍길동</TableCell>
              <TableCell>2024001</TableCell>
              <TableCell>개발팀</TableCell>
              <TableCell>대리</TableCell>
              <TableCell>2024-01-15</TableCell>
              <TableCell>010-1234-5678</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>작업</DropdownMenuLabel>
                    <DropdownMenuItem>상세 보기</DropdownMenuItem>
                    <DropdownMenuItem>수정</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            {/* 추가 행 반복 */}
          </TableBody>
        </Table>
      </div>

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
