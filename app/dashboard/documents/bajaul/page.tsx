"use client";

import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import { useDocument } from "@/hooks/useDocument";

// 바자울 자료실 페이지
export default function BajaulDocumentsPage() {
  const { documents, loading, error } = useDocument("BAJAUL");

  return (
    <div>
      <h1 className="text-3xl font-bold">바자울 자료실</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}

      <DocumentTable documents={documents} />
    </div>
  );
}
