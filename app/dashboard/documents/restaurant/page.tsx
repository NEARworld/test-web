"use client";

import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import DocumentTableSkeleton from "@/app/dashboard/documents/components/DocumentTableSkeleton";
import { useDocument } from "@/hooks/useDocument";

// 청년식당 자료실 페이지
export default function RestaurantDocumentsPage() {
  const { isLoading, error } = useDocument();

  if (error) {
    return <div>에러 발생: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">청년식당 자료실</h1>
      {isLoading ? <DocumentTableSkeleton /> : <DocumentTable />}
    </div>
  );
}
