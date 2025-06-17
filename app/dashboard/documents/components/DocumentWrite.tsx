"use client";

import React, { useState, useRef, useMemo } from "react";
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
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDocument } from "@/hooks/useDocument";
import { getFileExtension } from "@/lib/document-utils";

const DocumentWriteButton: React.FC = () => {
  const { isLoading } = useDocument();
  const [isOpen, setIsOpen] = useState(false);
  if (isLoading) {
    return <></>;
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="absolute right-0" variant="blue">
          글쓰기
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] w-[90vw] flex-col overflow-hidden p-0 md:h-[65vh] md:w-[50vw]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>새 문서 작성</DialogTitle>
          <DialogDescription>새 문서를 작성하고 저장하세요.</DialogDescription>
        </DialogHeader>
        <DocumentWriteForm setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
};

function DocumentWriteForm({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [titleValue, setTitleValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const boardType = useMemo(() => {
    return pathname.split("/").pop();
  }, [pathname]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!titleValue.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!boardType) {
      alert("게시판 종류를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.append("boardType", boardType);
    selectedFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });

    const res = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    setIsSubmitting(false);

    if (res.ok) {
      setIsOpen(false);
      window.location.reload();
    } else {
      alert("문서 저장에 실패했습니다.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFilesArray = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => {
        const uniqueNewFiles = newFilesArray.filter(
          (newFile) =>
            !prevFiles.some((prevFile) => prevFile.name === newFile.name),
        );
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (fileNameToRemove: string) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileNameToRemove),
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-grow flex-col overflow-hidden"
    >
      <div className="flex-grow space-y-4 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="문서 제목을 입력하세요"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
          />
        </div>

        <div className="flex flex-grow flex-col gap-1.5">
          <Label htmlFor="content">내용</Label>
          <Textarea
            id="content"
            name="content"
            placeholder="문서 내용을 입력하세요"
            className="min-h-[220px] resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fileInputTriggerButton">파일 첨부</Label>
          <Button
            type="button"
            id="fileInputTriggerButton"
            onClick={triggerFileInput}
            variant="outline"
            className="text-muted-foreground hover:text-accent-foreground w-full justify-start"
          >
            파일 선택...
          </Button>
          <Input
            type="file"
            id="fileInput"
            name="fileInput"
            ref={fileInputRef}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                선택된 파일:
              </p>
              <ul className="space-y-1 rounded-md border p-2 text-sm">
                {selectedFiles.map((file, index) => {
                  const extension = getFileExtension(file.name);
                  return (
                    <li
                      key={`${file.name}-${index}`}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-sm p-1"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {extension && (
                          <span className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-gray-700">
                            {extension}
                          </span>
                        )}
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                        className="text-muted-foreground hover:text-destructive h-auto flex-shrink-0 p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="border-t p-6 pt-4">
        <Button
          type="submit"
          className="bg-blue-500 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={!titleValue.trim() || isSubmitting}
        >
          {isSubmitting ? "저장중..." : "저장하기"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default DocumentWriteButton;
