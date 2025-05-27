"use client";

import DocumentTable from "@/app/dashboard/documents/components/DocumentTable";
import { useDocument } from "@/hooks/useDocument";

// 청년식당 자료실 페이지
export default function RestaurantDocumentsPage() {
  const { documents } = useDocument("RESTAURANT");
  return (
    <div>
      <h1>청년식당 자료실</h1>
      <p>이곳은 청년식당 자료실입니다.</p>

      <DocumentTable documents={documents} />
    </div>
  );
}
