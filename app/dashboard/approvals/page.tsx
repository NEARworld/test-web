// app/approvals/page.tsx
"use client"; // shadcn/ui 컴포넌트는 클라이언트 컴포넌트여야 합니다.

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

const ApprovalsPage: React.FC = () => {
  const [, setActiveTab] = React.useState<"All" | "Pending" | "Completed">(
    "All",
  );

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
      </div>
    </div>
  );
};

export default ApprovalsPage;
