// 한글 주석: other 페이지
import { useDocument } from "@/app/hooks/useDocument";

export default function OtherPage() {
  const { documents, loading, error } = useDocument("OTHER");
  return (
    <div>
      <h1>기타 자료실</h1>
      {documents && <pre>{JSON.stringify(documents, null, 2)}</pre>}
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}
    </div>
  );
}
