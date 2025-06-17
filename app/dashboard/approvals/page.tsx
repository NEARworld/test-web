"use client";

import ApprovalFormModal from "@/app/dashboard/approvals/components/ApprovalFormModal";
import { ApprovalRequestDialog } from "@/app/dashboard/approvals/components/ApprovalRequestDialog";
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
  ExtendedApprovalRequest,
  getKoreanStatus,
  getBadgeVariant,
} from "@/lib/approval-utils";
import { formatDateTime } from "@/lib/date-utils";
import { ApprovalStatus } from "@prisma/client";
import React, { useEffect, useState } from "react";

const ApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ApprovalStatus | "All">(
    "All",
  );
  const [approvalRequests, setApprovalRequests] = useState<
    ExtendedApprovalRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredItems = approvalRequests?.filter((item) => {
    if (activeTab === "All") return true;
    // 'Completed' 탭은 'Approved' 또는 'Rejected' 상태를 포함하도록 수정
    if (activeTab === "APPROVED") return item.status === "APPROVED";
    if (activeTab === "PENDING") return item.status === "PENDING";
    return item.status === activeTab;
  });

  useEffect(() => {
    const fetchApprovals = async () => {
      const response = await fetch("/api/approvals");
      const data = await response.json();
      setApprovalRequests(data.data);
      console.log(data.data);
      setIsLoading(false);
    };
    fetchApprovals();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
            <Tabs
              defaultValue="All"
              onValueChange={(value) =>
                setActiveTab(value as "All" | "PENDING" | "APPROVED")
              }
            >
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
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
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
                          {getKoreanStatus(item.status)}
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
