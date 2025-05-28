"use client";

import { createContext } from "react";

// 1. Context를 통해 제공될 값의 타입 정의
export interface DocumentContextType {
  documents: Document[] | null;
  loading: boolean;
  error: Error | null;
  fetchDocuments: () => Promise<void>; // 데이터를 수동으로 다시 가져올 함수
  currentBoardType: string | undefined; // 현재 Provider에 설정된 boardType
}

// 2. Context 객체 생성
export const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined,
);
