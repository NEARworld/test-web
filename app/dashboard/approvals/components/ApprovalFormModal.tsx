import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import { getFileExtension } from "@/lib/document-utils";
import { toast } from "sonner";

interface ApprovalFormModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export default function ApprovalFormModal({
  open,
  setOpen,
}: ApprovalFormModalProps) {
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 선택된 파일 목록 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("handleSubmit");

    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    try {
      setIsSubmitting(true);

      // FormData 생성
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      // 파일 추가
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // API 호출
      const response = await fetch("/api/approvals", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("결재 생성에 실패했습니다");
      }

      // 성공 처리
      toast.success("결재가 생성되었습니다");

      // 모달 닫기
      setOpen(false);

      // 폼 초기화
      setTitle("");
      setContent("");
      setSelectedFiles([]);

      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("결재 생성 중 오류 발생:", error);
      toast.error("결재 생성에 실패했습니다", {
        description: "잠시 후 다시 시도해주세요",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 파일 선택 버튼 클릭 핸들러
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 변경 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 파일 제거 핸들러
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="blue" className="cursor-pointer">
          결재 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] md:w-[70vw]">
        <DialogHeader>
          <DialogTitle>결재 생성하기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="mt-3 grid w-full items-center gap-1.5">
            <Label htmlFor="approvalName">결재 이름</Label>
            <Input
              type="text"
              id="approvalName"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="결재 제목을 입력하세요"
            />
          </div>
          <div className="mt-3 grid w-full items-center gap-1.5">
            <Label htmlFor="approvalName">결재 상세</Label>
            <Textarea
              id="approvalName"
              className="min-h-60"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="결재 내용을 입력하세요"
            />
          </div>
          <div className="mt-3 grid w-full items-center gap-1.5">
            <Label htmlFor="approvalName">결재 문서 등록</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFileButtonClick}
                className="w-full cursor-pointer"
              >
                결재에 필요한 문서들을 첨부하세요
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                id="approvalName"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              {/* 선택된 파일 목록 */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {getFileExtension(file.name)}
                        </span>
                        <span className="max-w-52 truncate text-sm">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="secondary" className="float-left">
                닫기
              </Button>
            </DialogClose>
            <Button type="submit" variant="blue" disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
