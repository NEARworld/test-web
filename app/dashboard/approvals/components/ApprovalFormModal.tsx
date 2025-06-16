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
      <DialogContent className="w-[90vw] md:w-[70vw]">
        <DialogHeader>
          <DialogTitle>결재 생성하기</DialogTitle>
        </DialogHeader>
        <div className="mt-3 grid w-full items-center gap-1.5">
          <Label htmlFor="approvalName">결재 이름</Label>
          <Input
            type="text"
            id="approvalName"
            placeholder="예: 휴가 신청서, 품의서 등"
            // value={value}
            // onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className="mt-3 grid w-full items-center gap-1.5">
          <Label htmlFor="approvalName">결재 상세</Label>
          <Textarea
            id="approvalName"
            placeholder="예: 휴가 신청서, 품의서 등"
            className="min-h-60"
            // value={value}
            // onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <div className="mt-3 grid w-full items-center gap-1.5">
          <Label htmlFor="approvalName">결재 문서 등록</Label>
          <Input
            type="file"
            id="approvalName"
            placeholder="예: 휴가 신청서, 품의서 등"
            // value={value}
            // onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
