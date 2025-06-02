// app/approvals/page.tsx
"use client"; // shadcn/ui 컴포넌트는 클라이언트 컴포넌트여야 합니다.

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
import React from "react";

interface ApprovalItem {
  id: string;
  request: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  requestedOn: string;
  action: "Approve" | "View";
}

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

  const filteredItems = approvalItems.filter((item) => {
    if (activeTab === "All") return true;
    // 'Completed' 탭은 'Approved' 또는 'Rejected' 상태를 포함하도록 수정
    if (activeTab === "Completed")
      return item.status === "Approved" || item.status === "Rejected";
    return item.status === activeTab;
  });

  console.log(approvalItems);

  return (
    <div className="font-inter min-h-screen md:px-4">
      <div className="max-w-7xl px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전자 결재 시스템</h1>
        </header>

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

        <div className="hidden overflow-hidden rounded-lg bg-white shadow-sm md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Requested on</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.request}
                    </TableCell>
                    <TableCell>
                      <Badge>{item.status}</Badge>
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
    </div>
  );
};

export default ApprovalsPage;
