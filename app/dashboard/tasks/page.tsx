"use client";

import { BarChart3, CalendarCheck2, ClipboardList, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TasksPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">업무 관리 대시보드</h1>

      {/* 위젯들 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* 아래쪽 영역: 예약 리스트, 재고 상태 등 추가 가능 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-4 text-lg font-semibold">업무 목록</h2>
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                {/* 행 높이 줄이기 */}
                <TableHead className="px-2 py-1 text-sm">업무 제목</TableHead>
                <TableHead className="px-2 py-1 text-sm">담당자</TableHead>
                <TableHead className="px-2 py-1 text-sm">마감일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="h-8">
                <TableCell className="px-2 py-1 text-sm">
                  재고 현황 점검
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">김민수</TableCell>
                <TableCell className="px-2 py-1 text-sm">2025-04-10</TableCell>
              </TableRow>
              <TableRow className="h-8">
                <TableCell className="px-2 py-1 text-sm">
                  예약 통계 보고서 작성
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">이영희</TableCell>
                <TableCell className="px-2 py-1 text-sm">2025-04-05</TableCell>
              </TableRow>
              <TableRow className="h-8">
                <TableCell className="px-2 py-1 text-sm">
                  신규 메뉴 기획 회의
                </TableCell>
                <TableCell className="px-2 py-1 text-sm">박지훈</TableCell>
                <TableCell className="px-2 py-1 text-sm">2025-04-12</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
