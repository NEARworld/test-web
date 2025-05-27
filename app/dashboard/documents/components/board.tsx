import { usePathname } from "next/navigation";
import { useDocument } from "@/hooks/useDocument";

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
  const { documents, loading, error } = useDocument(boardType);

  return (
    <div>
      <h1>Board</h1>
      {/* 한글 주석: 로딩, 에러, 데이터 상태에 따라 분기 렌더링 */}
      {loading && <div>로딩 중...</div>}
      {error && <div>에러 발생: {error.message}</div>}
      {documents && <pre>{JSON.stringify(documents, null, 2)}</pre>}
    </div>
  );
}
