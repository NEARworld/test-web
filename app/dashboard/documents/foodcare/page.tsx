// 먹거리돌봄 센터 자료실 페이지
import { useDocument } from "@/app/hooks/useDocument";

export default function FoodCareDocumentsPage() {
  const { documents, loading, error } = useDocument("FOODCARE");
  return (
    <div>
      {/* 먹거리돌봄 센터 자료실 페이지 */}
      <h1>먹거리돌봄 센터 자료실</h1>
      <p>이곳은 먹거리돌봄 센터 자료실입니다.</p>
      {documents && <pre>{JSON.stringify(documents, null, 2)}</pre>}
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}
    </div>
  );
}
