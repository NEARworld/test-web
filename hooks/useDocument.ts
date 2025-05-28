"use client";

import { DocumentContext } from "@/contexts/DocumentProvider";
import { useContext } from "react";

// 자료실(boardType)별 자료를 가져오는 커스텀 훅
export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error(
      "useDocument는 DocumentProvider 내부에서 사용되어야 합니다.",
    );
  }
  return context;
}
