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
import { useRef } from "react";

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

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: 폼 데이터 처리 로직 구현
    console.log("폼 제출됨");
  };

  // 파일 선택 버튼 클릭 핸들러
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
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
              // value={value}
              // onChange={(e) => onChange(e.target.value)}
            />
          </div>
          <div className="mt-3 grid w-full items-center gap-1.5">
            <Label htmlFor="approvalName">결재 상세</Label>
            <Textarea
              id="approvalName"
              className="min-h-60"
              // value={value}
              // onChange={(e) => onChange(e.target.value)}
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
                // value={value}
                // onChange={(e) => onChange(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="secondary" className="float-left">
                닫기
              </Button>
            </DialogClose>
            <Button type="submit" variant="blue">
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
