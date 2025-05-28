"use client";

import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import { useDocument } from "@/hooks/useDocument";

export default function CommunityPage() {
  const { documents, loading, error } = useDocument("COMMUNITY");

  return (
    <div>
      <h1 className="text-3xl font-bold">공동모금회 자료실</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}

      <DocumentTable documents={documents} />
    </div>
  );
}
