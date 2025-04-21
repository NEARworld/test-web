import { useState, useEffect } from "react";
import { toast } from "sonner";

/**
 * 검색 기능을 위한 커스텀 훅
 * @param initialData 초기 데이터 배열
 * @param searchEndpoint 검색 API 엔드포인트
 * @returns 검색 관련 상태와 함수들
 */
export function useSearch<T>(
  initialData: T[] | undefined,
  searchEndpoint: string,
): {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredData: T[] | undefined;
  isSearching: boolean;
  handleSearch: (e?: React.FormEvent) => Promise<void>;
} {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredData, setFilteredData] = useState<T[] | undefined>(
    initialData,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 검색어가 변경될 때마다 데이터 업데이트
  useEffect(() => {
    if (!searchTerm.trim() || !initialData) {
      setFilteredData(initialData);
    }
  }, [searchTerm, initialData]);

  // initialData가 변경될 때 filteredData 업데이트
  useEffect(() => {
    setFilteredData(initialData);
  }, [initialData]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchTerm.trim()) {
      // 검색어가 비어있으면 원래 데이터 표시
      setFilteredData(initialData);
      return;
    }

    try {
      setIsSearching(true);

      // API 엔드포인트 호출
      const response = await fetch(
        `${searchEndpoint}?term=${encodeURIComponent(searchTerm.trim())}`,
      );

      if (!response.ok) {
        throw new Error("검색 중 오류가 발생했습니다");
      }

      const data = await response.json();
      setFilteredData(data);
    } catch (error) {
      console.error("검색 오류:", error);
      toast.error("검색 중 오류가 발생했습니다");
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isSearching,
    handleSearch,
  };
}

export default useSearch;
