"use client";

import { useDocument } from "@/hooks/useDocument";
import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import DocumentTableSkeleton from "@/app/dashboard/documents/components/DocumentTableSkeleton";
export default function OtherPage() {
  const { loading, error } = useDocument();

  if (error) {
    return <div>에러 발생: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">기타 자료실</h1>
      {loading ? <DocumentTableSkeleton /> : <DocumentTable />}
    </div>
  );
}
