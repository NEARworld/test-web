"use client";

import { Document } from "@prisma/client";
import { useEffect, useState, useCallback } from "react";

// 자료실(boardType)별 자료를 가져오는 커스텀 훅
export function useDocument(boardType: string | undefined) {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!boardType) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?boardType=${boardType}`);
      const data = await res.json();
      setDocuments(data);
      // 한글 주석: 받아온 자료를 콘솔에 출력
      console.log(`${boardType} 자료실 데이터:`, data);
    } catch (err) {
      // 한글 주석: 에러 발생 시 상태에 저장
      setError(err as Error);
      console.error("자료실 데이터 조회 에러:", err);
    } finally {
      setLoading(false);
    }
  }, [boardType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, fetchDocuments };
}
