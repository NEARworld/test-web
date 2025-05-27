"use client";

import { useDocument } from "@/hooks/useDocument";
import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import React from "react";

// 더미 게시글 데이터

export default function CorpDocumentsPage() {
  const { documents, loading, error } = useDocument("CORP");
  return (
    <div>
      <h1>법인 자료실</h1>
      <p>이곳은 법인 자료실입니다.</p>

      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}

      <DocumentTable documents={documents} />
    </div>
  );
}
