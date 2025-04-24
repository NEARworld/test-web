import React, { ReactNode } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { UserAvatar } from "@/components/user-avatar";
import { ExtendedTask } from "../page";
import {
  formatDate,
  formatDateWithWeekday,
  Skeleton,
  DOTS,
  getPaginationRange,
  getFileIcon,
} from "../utils/TaskUtils";

interface TaskTableProps {
  filteredTasks: ExtendedTask[] | undefined;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
  isInitialLoading: boolean;
  isPageChanging: boolean;
  currentPage: number;
  totalPages: number;
  totalTasks: number;
  startIndex: number;
  endIndex: number;
  setCurrentTask: React.Dispatch<
    React.SetStateAction<ExtendedTask | undefined>
  >;
  setIsTaskViewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handlePageChange: (page: number) => void;
}

export default function TaskTable({
  filteredTasks,
  searchTerm,
  setSearchTerm,
  handleSearch,
  isSearching,
  isInitialLoading,
  isPageChanging,
  currentPage,
  totalPages,
  totalTasks,
  startIndex,
  endIndex,
  setCurrentTask,
  setIsTaskViewOpen,
  handlePageChange,
}: TaskTableProps) {
  // 조건부 렌더링 헬퍼 함수
  const renderContent = (
    isLoading: boolean,
    skeleton: ReactNode,
    content: ReactNode,
  ): ReactNode => {
    return isLoading ? skeleton : content;
  };

  const paginationRange = getPaginationRange(totalPages, currentPage);

  return (
    <>
      <div className="flex items-center justify-end px-4 py-3">
        <div className="relative w-full max-w-sm">
          <form onSubmit={handleSearch}>
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              type="text"
              placeholder="검색어를 입력 후 엔터를 눌러주세요"
              className="pr-4 pl-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <div className="absolute top-2.5 right-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Task Table */}
      <div className="overflow-x-auto rounded-none border">
        <Table className="w-full table-fixed md:min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted h-10 border-b">
              <TableHead className="text-muted-foreground w-[50px] px-3 py-2 text-center text-sm font-medium md:w-[60px]">
                번호
              </TableHead>
              <TableHead className="text-muted-foreground w-auto px-3 py-2 text-sm font-medium md:w-[30%]">
                업무 제목
              </TableHead>
              <TableHead className="text-muted-foreground w-[100px] px-3 py-2 text-sm font-medium md:text-start">
                담당자
              </TableHead>
              <TableHead className="text-muted-foreground hidden w-[120px] px-3 py-2 text-sm font-medium md:table-cell md:w-[15%]">
                작성자
              </TableHead>
              <TableHead className="text-muted-foreground hidden w-[100px] px-3 py-2 text-sm font-medium md:table-cell md:w-[10%]">
                첨부 파일
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell md:w-[140px]">
                등록일
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-3 py-2 text-sm font-medium md:table-cell md:w-[140px]">
                마감일
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="relative">
            {/* 첫 진입(데이터 전혀 없음)일 때만 '전체 스피너 행' */}
            {isInitialLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex h-60 flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      업무 불러오는 중...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTasks && filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const itemNumber = totalTasks - startIndex - index;
                return (
                  <TableRow
                    className="hover:bg-muted/50 data-[state=selected]:bg-muted h-12 border-b transition-colors"
                    key={task.id}
                    onClick={() => {
                      setCurrentTask(task);
                      setIsTaskViewOpen(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {/* 번호 */}
                    <TableCell className="text-muted-foreground w-[50px] text-center text-sm md:w-[60px]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        itemNumber,
                      )}
                    </TableCell>
                    {/* 업무 제목 */}
                    <TableCell className="w-auto truncate px-3 py-2 text-sm font-medium md:w-[30%]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        <div className="truncate">{task.title}</div>,
                      )}
                    </TableCell>
                    {/* 담당자 */}
                    <TableCell className="text-muted-foreground w-[100px] px-3 py-2 text-right md:text-start md:text-sm">
                      <div className="flex items-center justify-start gap-1">
                        {renderContent(
                          isPageChanging,
                          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />,
                          <UserAvatar
                            src={
                              task.assignee && "image" in task.assignee
                                ? typeof task.assignee.image === "string"
                                  ? task.assignee.image
                                  : undefined
                                : undefined
                            }
                            name={task.assignee?.name ?? ""}
                          />,
                        )}
                        {renderContent(
                          isPageChanging,
                          <Skeleton width="w-14" height="h-4" />,
                          <span className="max-w-[50px] overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[80px]">
                            {task.assignee?.name ?? "미지정"}
                          </span>,
                        )}
                      </div>
                    </TableCell>
                    {/* 작성자 */}
                    <TableCell className="text-muted-foreground hidden w-[120px] px-3 py-2 text-sm md:table-cell md:w-[15%]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        task.creator ? (
                          <div className="flex items-center gap-1">
                            <UserAvatar
                              src={
                                typeof task.creator.image === "string"
                                  ? task.creator.image
                                  : undefined
                              }
                              name={task.creator.name ?? ""}
                            />
                            <span className="max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {task.creator.name ?? ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        ),
                      )}
                    </TableCell>
                    {/* 첨부 파일 */}
                    <TableCell className="text-muted-foreground hidden w-[100px] px-3 py-2 text-sm md:table-cell md:w-[10%]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        task.fileUrl && task.fileName ? (
                          <div className="flex items-center space-x-1">
                            {getFileIcon(task.fileName)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        ),
                      )}
                    </TableCell>
                    {/* 등록일 */}
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell md:w-[140px]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        formatDate(task.createdAt),
                      )}
                    </TableCell>
                    {/* 마감일 */}
                    <TableCell className="text-muted-foreground hidden px-3 py-2 text-sm md:table-cell md:w-[140px]">
                      {renderContent(
                        isPageChanging,
                        <Skeleton width="w-full" height="h-4" />,
                        formatDateWithWeekday(task.dueDate),
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                {/* Adjust colSpan if file header is added */}
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground h-24 text-center"
                >
                  {searchTerm.trim()
                    ? "검색 결과가 없습니다."
                    : "등록된 업무가 없습니다."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-y-2 border-t px-4 py-3 sm:flex-row sm:gap-y-0">
          <div className="text-muted-foreground text-sm">
            총 {totalTasks}개 중 {startIndex + 1} - {endIndex} 표시 중 (페이지{" "}
            {currentPage}/{totalPages})
          </div>
          <Pagination>
            <PaginationContent>
              {/* 이전 페이지 버튼 */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* 페이지 번호 링크들 */}
              {paginationRange.map((page, index) => {
                if (page === DOTS) {
                  return (
                    <PaginationItem key={DOTS + index}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page as number);
                      }}
                      isActive={page === currentPage}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {/* 다음 페이지 버튼 */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
