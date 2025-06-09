"use client";

import { ApprovalRequestDialog } from "@/app/dashboard/approvals/components/ApprovalRequestDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ApprovalItem,
  ApprovalRequest,
  getKoreanStatus,
  mockApprovalRequest,
  getBadgeVariant,
} from "@/lib/approval-utils";
import React, { useState } from "react";

const approvalItems: ApprovalItem[] = [
  {
    id: "1",
    request: "New hire request for Marketing",
    status: "Pending",
    requestedBy: "Sophia Clark",
    requestedOn: "05/12/2024",
    action: "Approve",
  },
  {
    id: "2",
    request: "Purchase order for office supplies",
    status: "Approved",
    requestedBy: "Ethan Carter",
    requestedOn: "05/10/2024",
    action: "View",
  },
];

const ApprovalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<
    "All" | "Pending" | "Completed"
  >("All");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);

  const handleRowClick = (item: ApprovalItem) => {
    // 'View' 액션인 경우에만 다이얼로그를 엽니다. (예시 로직)
    if (item.action === "View") {
      // 실제로는 item.id를 기반으로 API를 호출하여 상세 데이터를 가져옵니다.
      // 여기서는 목데이터를 사용합니다.
      setSelectedRequest(mockApprovalRequest || null);
      setIsDialogOpen(true);
    }
  };

  const filteredItems = approvalItems.filter((item) => {
    if (activeTab === "All") return true;
    // 'Completed' 탭은 'Approved' 또는 'Rejected' 상태를 포함하도록 수정
    if (activeTab === "Completed")
      return item.status === "Approved" || item.status === "Rejected";
    return item.status === activeTab;
  });

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
                setActiveTab(value as "All" | "Pending" | "Completed")
              }
            >
              <TabsList className="mb-6 grid w-full grid-cols-3 md:w-[400px]">
                <TabsTrigger value="All" className="cursor-pointer">
                  모든 결재
                </TabsTrigger>
                <TabsTrigger value="Pending" className="cursor-pointer">
                  결재 대기
                </TabsTrigger>
                <TabsTrigger value="Completed" className="cursor-pointer">
                  결재 완료
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button className="cursor-pointer" variant="blue">
              결재 생성
            </Button>
          </div>

          <div className="hidden overflow-hidden rounded-lg bg-white shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">결재 요청</TableHead>
                  <TableHead>결재 상태</TableHead>
                  <TableHead>요청자</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead className="text-right">제어</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell className="font-medium">
                        {item.request}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(item.status)}>
                          {getKoreanStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.requestedBy}</TableCell>
                      <TableCell>{item.requestedOn}</TableCell>
                      <TableCell className="text-right">
                        {item.action === "Approve" ? (
                          <Button variant="outline" size="sm">
                            Approve
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No items found for &quot;{activeTab}&quot;.
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
