// app/approvals/page.tsx
"use client"; // shadcn/ui 컴포넌트는 클라이언트 컴포넌트여야 합니다.

import React from "react";

const ApprovalsPage: React.FC = () => {
  return (
    <div className="font-inter min-h-screen md:px-4">
      <div className="max-w-7xl px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전자 결재 시스템</h1>
        </header>
      </div>
    </div>
  );
};

export default ApprovalsPage;
