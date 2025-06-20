"use client";

import ApprovalFormModal from "@/app/dashboard/approvals/components/ApprovalFormModal";
import { ApprovalRequestDialog } from "@/app/dashboard/approvals/components/ApprovalRequestDialog";
import ApprovalTableSkeleton from "@/app/dashboard/approvals/components/ApprovalTableSkeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ExtendedApprovalRequest,
  getBadgeVariant,
  getCurrentStepText,
} from "@/lib/approval-utils";
import { formatDateTime } from "@/lib/date-utils";
import { ApprovalStatus } from "@prisma/client";
import React, { useEffect, useState } from "react";

// 페이지네이션 정보 타입 정의
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ApprovalStatus | "All">(
    "All",
  );
  const [approvalRequests, setApprovalRequests] = useState<
    ExtendedApprovalRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 페이지당 표시할 항목 수
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ExtendedApprovalRequest | null>(null);
  const [isOpenApprovalModal, setIsOpenApprovalModal] = useState(false);

  const handleRowClick = (item: ExtendedApprovalRequest) => {
    // 'View' 액션인 경우에만 다이얼로그를 엽니다. (예시 로직)
    // 실제로는 item.id를 기반으로 API를 호출하여 상세 데이터를 가져옵니다.
    // 여기서는 목데이터를 사용합니다.
    setSelectedRequest(item);
    setIsDialogOpen(true);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 탭 변경 시 첫 페이지로 이동
  const handleTabChange = (value: string) => {
    setActiveTab(value as "All" | "PENDING" | "APPROVED");
    setCurrentPage(1);
  };

  // 페이지 번호 배열 생성 (최대 5개 페이지 번호 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = paginationInfo.totalPages;

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모든 페이지 번호 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 최대 5개 페이지 번호 표시
      let startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  useEffect(() => {
    const fetchApprovals = async () => {
      setIsLoading(true);
      try {
        // 상태에 따른 쿼리 파라미터 구성
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          activeTab: activeTab,
        });

        const response = await fetch(`/api/approvals?${params}`);
        const data = await response.json();

        if (data.data) {
          setApprovalRequests(data.data);
          setPaginationInfo(data.pagination);
        }
      } catch (error) {
        console.error("결재 목록 조회 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, [currentPage, activeTab, itemsPerPage]);

  return (
    <>
      <div className="font-inter min-h-screen md:px-4">
        <div className="max-w-7xl px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              전자 결재 시스템
            </h1>
          </header>

          <div className="mb-3 flex justify-between">
            <Tabs defaultValue="All" onValueChange={handleTabChange}>
              <TabsList className="mb-6 grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="All" className="cursor-pointer">
                  모든 결재
                </TabsTrigger>
                <TabsTrigger value="PENDING" className="cursor-pointer">
                  결재 대기
                </TabsTrigger>
                <TabsTrigger value="APPROVED" className="cursor-pointer">
                  결재 완료
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ApprovalFormModal
              open={isOpenApprovalModal}
              setOpen={setIsOpenApprovalModal}
            />
          </div>

          {/* 로딩 상태일 때 스켈레톤 표시 */}
          {isLoading ? (
            <ApprovalTableSkeleton />
          ) : (
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
                  {approvalRequests.length > 0 ? (
                    approvalRequests.map((item) => (
                      <TableRow
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(item.status)}>
                            {getCurrentStepText(item.steps)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.createdBy.name}</TableCell>
                        <TableCell>
                          {formatDateTime(item.createdAt, {
                            includeWeekday: false,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        데이터가 존재하지 않습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 페이지네이션 컴포넌트 */}
          {!isLoading && paginationInfo.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {/* 이전 페이지 버튼 */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* 페이지 번호들 */}
                  {getPageNumbers().map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNumber);
                        }}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* 다음 페이지 버튼 */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < paginationInfo.totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === paginationInfo.totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
        <ApprovalRequestDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          requestData={selectedRequest}
        />
      </div>
    </>
  );
};

export default ApprovalsPage;
