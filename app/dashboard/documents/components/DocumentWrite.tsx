"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Props가 없으므로 인터페이스를 비워두거나 제거할 수 있습니다.
// interface DocumentWriteButtonProps {}

const DocumentWriteButton: React.FC = () => {
  // Props를 받지 않으므로 FC만 사용합니다.
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="absolute right-0 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700">
          글쓰기
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] w-[90vw] flex-col md:h-[50vh] md:w-[50vw]">
        <DialogHeader>
          <DialogTitle>새 문서 작성</DialogTitle>
          <DialogDescription>
            새 문서를 작성하고 저장하세요. {/* 설명 업데이트 */}
          </DialogDescription>
        </DialogHeader>
        {/* 문서 작성 폼 */}
        <DocumentWriteForm />
      </DialogContent>
    </Dialog>
  );
};

function DocumentWriteForm() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-grow flex-col gap-4 overflow-hidden py-4"
    >
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          제목
        </Label>
        <Input
          id="title"
          placeholder="문서 제목을 입력하세요"
          className="col-span-3"
        />
      </div>
      <div className="grid flex-grow grid-cols-4 items-start gap-4">
        <Label htmlFor="content" className="mt-2 text-right">
          내용
        </Label>
        <Textarea
          id="content"
          placeholder="문서 내용을 입력하세요"
          className="col-span-3 h-full resize-none"
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          className="bg-blue-500 text-white hover:bg-blue-700"
        >
          저장하기
        </Button>
      </DialogFooter>
    </form>
  );
}

export default DocumentWriteButton;
