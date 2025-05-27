"use client";

import { useDocument } from "@/hooks/useDocument";
import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
export default function OtherPage() {
  const { documents, loading, error } = useDocument("OTHER");
  return (
    <div>
      <h1>기타 자료실</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}

      <DocumentTable documents={documents} />
    </div>
  );
}
