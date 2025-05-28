"use client";

import { useDocument } from "@/hooks/useDocument";
import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
export default function FoodCareDocumentsPage() {
  const { documents, loading, error } = useDocument("FOODCARE");
  return (
    <div>
      <h1 className="text-3xl font-bold">먹거리돌봄 센터 자료실</h1>
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}

      <DocumentTable documents={documents} />
    </div>
  );
}
