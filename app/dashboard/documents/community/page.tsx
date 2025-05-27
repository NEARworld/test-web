"use client";

import { useDocument } from "@/hooks/useDocument";

export default function CommunityPage() {
  const { documents, loading, error } = useDocument("COMMUNITY");

  return (
    <div>
      <h1>Community Page</h1>
      {documents && <pre>{JSON.stringify(documents, null, 2)}</pre>}
      {loading && <p>로딩 중...</p>}
      {error && <p>에러 발생: {error.message}</p>}
    </div>
  );
}
