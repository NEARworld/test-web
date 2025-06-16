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

interface ApprovalFormModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export default function ApprovalFormModal({
  open,
  setOpen,
}: ApprovalFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="blue" className="cursor-pointer">
          결재 생성
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>빈 모달</DialogTitle>
        </DialogHeader>
        {/* 여기에 필요한 내용을 삽입 */}
        <div className="py-4">여기에 전자결재 폼 등을 넣을 수 있습니다.</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
