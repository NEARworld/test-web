"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DocumentWithCreatedBy } from "@/types/document";
import { usePathname } from "next/navigation";
// Context를 통해 제공될 값의 타입 정의
export interface DocumentContextType {
  documents: DocumentWithCreatedBy[] | null;
  isLoading: boolean;
  error: Error | null;
  fetchDocuments: () => Promise<void>;
  currentBoardType: string | undefined;
  currentPage: number;
  totalPages: number | null;
  totalDocuments: number | null;
  setCurrentPage: (page: number) => void;
  pageSize: number;
}

// Context 객체 생성
export const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined,
);

// Provider 컴포넌트 Props 타입 정의
interface DocumentProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트 생성
export const DocumentProvider = ({ children }: DocumentProviderProps) => {
  const [documents, setDocuments] = useState<DocumentWithCreatedBy[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pathname = usePathname();
  const boardType = pathname.split("/").pop();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalDocuments, setTotalDocuments] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!boardType) {
      setDocuments(null);
      setIsLoading(false);
      setTotalPages(null);
      setTotalDocuments(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents?boardType=${boardType}&page=${currentPage}&pageSize=${pageSize}`,
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(
          errorData.message || `Failed to fetch documents: ${res.status}`,
        );
      }

      const data = await res.json();
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
      setTotalDocuments(data.totalDocuments);
      console.log(`${boardType} 자료실 데이터 (페이지 ${currentPage}):`, data);
    } catch (err) {
      setError(err as Error);
      console.error("자료실 데이터 조회 에러:", err);
      setDocuments(null);
      setTotalPages(null);
      setTotalDocuments(null);
    } finally {
      setIsLoading(false);
    }
  }, [boardType, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [boardType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSetCurrentPage = (page: number) => {
    setCurrentPage(page);
  };

  const contextValue = useMemo(
    () => ({
      documents,
      isLoading,
      error,
      fetchDocuments,
      currentBoardType: boardType,
      currentPage,
      totalPages,
      totalDocuments,
      setCurrentPage: handleSetCurrentPage,
      pageSize,
    }),
    [
      documents,
      isLoading,
      error,
      fetchDocuments,
      boardType,
      currentPage,
      totalPages,
      totalDocuments,
      pageSize,
    ],
  );

  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
};
