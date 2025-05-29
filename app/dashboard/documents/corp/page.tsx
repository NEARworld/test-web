"use client";

import { useDocument } from "@/hooks/useDocument";
import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import React from "react";
import DocumentTableSkeleton from "@/app/dashboard/documents/components/DocumentTableSkeleton";

// 더미 게시글 데이터

export default function CorpDocumentsPage() {
  const { isLoading, error } = useDocument();

  if (error) {
    return <div>에러 발생: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">법인 자료실</h1>

      {isLoading ? <DocumentTableSkeleton /> : <DocumentTable />}
    </div>
  );
}
