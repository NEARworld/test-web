import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Document import 제거
// import { Document } from "@prisma/client";

export type ExtendedDocument = {
  assignee: { name: string; image?: string };
  creator?: { id: string; name: string; image?: string } | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
};

export default function Board() {
  const pathname = usePathname(); // 현재 경로 가져오기

  // 경로에서 boardType 추출 (예: /dashboard/documents/bajaul -> BAJAUL)
  const boardType = pathname?.split("/").pop()?.toUpperCase();

  useEffect(() => {
    if (!boardType) return;
    // 자료실(boardType)별 자료 조회 GET 요청
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`/api/documents?boardType=${boardType}`);
        const data = await res.json();
        // 한글 주석: 받아온 자료를 콘솔에 출력
        console.log(`${boardType} 자료실 데이터:`, data);
      } catch (error) {
        // 한글 주석: 에러 발생 시 콘솔에 출력
        console.error("자료실 데이터 조회 에러:", error);
      }
    };
    fetchDocuments();
  }, [boardType]);

  return (
    <div>
      <h1>Board</h1>
    </div>
  );
}
