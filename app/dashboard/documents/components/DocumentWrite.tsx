"use client";

import React, { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted");
    const formData = new FormData(event.currentTarget);
    selectedFiles.forEach((file) => {
      formData.append("files", file, file.name);
    });
    console.log(
      "Form data entries (with files):",
      Object.fromEntries(formData.entries()),
    );
    // 여기에 실제 서버 전송 로직 추가
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      "handleFileChange triggered. event.target.files:",
      event.target.files,
    );
    if (event.target.files && event.target.files.length > 0) {
      const newFilesArray = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => {
        console.log("Inside setSelectedFiles updater - prevFiles:", prevFiles);
        console.log(
          "Inside setSelectedFiles updater - newFilesArray:",
          newFilesArray,
        );
        // 파일 이름으로 중복 체크하여 이미 있는 파일은 추가하지 않도록 개선
        const uniqueNewFiles = newFilesArray.filter(
          (newFile) =>
            !prevFiles.some((prevFile) => prevFile.name === newFile.name),
        );
        const updatedFiles = [...prevFiles, ...uniqueNewFiles];
        console.log(
          "Inside setSelectedFiles updater - resulting updatedFiles:",
          updatedFiles,
        );
        return updatedFiles;
      });
    }
    // 파일 선택 후 input 값을 초기화하여 동일한 파일을 다시 선택할 수 있도록 합니다.
    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (fileNameToRemove: string) => {
    setSelectedFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter(
        (file) => file.name !== fileNameToRemove,
      );
      console.log(
        `Removed file: ${fileNameToRemove}, updated list:`,
        updatedFiles,
      );
      return updatedFiles;
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          name="title"
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
          name="content"
          placeholder="문서 내용을 입력하세요"
          className="col-span-3 h-full resize-none"
        />
      </div>
      {/* 파일 첨부 UI 개선된 부분 */}
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
        {/* 선택된 파일 목록 표시 및 삭제 버튼 추가 */}
        {selectedFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-muted-foreground text-sm font-medium">
              선택된 파일:
            </p>
            <ul className="max-h-24 overflow-y-auto rounded-md border p-2 text-sm">
              {selectedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-sm p-1"
                >
                  <span className="truncate pr-2" title={file.name}>
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.name)}
                    className="text-muted-foreground hover:text-destructive h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
