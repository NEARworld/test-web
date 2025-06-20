import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// 결재 테이블 스켈레톤 컴포넌트
const ApprovalTableSkeleton: React.FC = () => {
  return (
    <div className="hidden overflow-hidden rounded-lg bg-white shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">결재 요청</TableHead>
            <TableHead>결재 상태</TableHead>
            <TableHead>요청자</TableHead>
            <TableHead>요청일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-[200px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-[120px]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApprovalTableSkeleton;
