"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

// Props가 없으므로 인터페이스를 비워두거나 제거할 수 있습니다.
// interface DocumentWriteButtonProps {}

const DocumentWriteButton: React.FC = () => {
  // Props를 받지 않으므로 FC만 사용합니다.
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="absolute right-0 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
          글쓰기
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 문서 작성</DialogTitle>
          <DialogDescription>
            여기에 문서 작성 폼이 표시됩니다. {/* 초기 빈 모달 설명 */}
          </DialogDescription>
        </DialogHeader>
        {/* 모달 내용은 여기에 추가됩니다. */}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentWriteButton;
