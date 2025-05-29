import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// 테이블 로우 스켈레톤 컴포넌트
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-5 w-[80%]" />
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-20" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-5 w-16" />
    </TableCell>
  </TableRow>
);

// 문서 테이블 스켈레톤 컴포넌트
export default function DocumentTableSkeleton() {
  return (
    <div className="mt-4 rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">제목</TableHead>
            <TableHead>작성자</TableHead>
            <TableHead>게시일</TableHead>
            <TableHead>첨부파일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </TableBody>
      </Table>
    </div>
  );
}
