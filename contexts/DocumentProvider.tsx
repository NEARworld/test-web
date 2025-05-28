"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// Context를 통해 제공될 값의 타입 정의
export interface DocumentContextType {
  documents: Document[] | null;
  loading: boolean;
  error: Error | null;
  fetchDocuments: () => Promise<void>; // 데이터를 수동으로 다시 가져올 함수
  currentBoardType: string | undefined; // 현재 Provider에 설정된 boardType
}

// Context 객체 생성
export const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined,
);

// Provider 컴포넌트 Props 타입 정의
interface DocumentProviderProps {
  children: ReactNode;
  boardType: string | undefined;
}

// Provider 컴포넌트 생성
export const DocumentProvider = ({
  children,
  boardType,
}: DocumentProviderProps) => {
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    // 자료실 타입이 없으면 데이터를 가져오지 않음
    if (!boardType) {
      setDocuments(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 자료실 타입에 따른 데이터 가져오기
      const res = await fetch(`/api/documents?boardType=${boardType}`);

      // 데이터를 가져오지 못했으면 에러 처리
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(
          errorData.message || `Failed to fetch documents: ${res.status}`,
        );
      }

      // 데이터를 가져오면 상태 업데이트
      const data = await res.json();
      setDocuments(data);
      console.log(`${boardType} 자료실 데이터:`, data);
    } catch (err) {
      // 에러 발생 시 에러 상태 업데이트
      setError(err as Error);
      console.error("자료실 데이터 조회 에러:", err);
      setDocuments(null);
    } finally {
      // 데이터 조회 완료 시 로딩 상태 업데이트
      setLoading(false);
    }
  }, [boardType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Context 값 생성
  // useMemo를 사용하여 불필요한 리렌더링 방지
  const contextValue = useMemo(
    () => ({
      documents,
      loading,
      error,
      fetchDocuments,
      currentBoardType: boardType,
    }),
    [documents, loading, error, fetchDocuments, boardType],
  );

  // Provider 컴포넌트 반환
  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
};
