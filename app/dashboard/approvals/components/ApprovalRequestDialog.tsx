"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { type ExtendedApprovalRequest } from "@/lib/approval-utils";
import { formatDateTime } from "@/lib/date-utils";

// 상세 정보 항목을 위한 작은 컴포넌트
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-1 items-start gap-4 border-b py-4 md:grid-cols-[120px_1fr]">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    {/* pre-wrap을 사용하여 긴 설명이 줄바꿈되도록 처리 */}
    <dd className="text-foreground text-sm whitespace-pre-wrap">{value}</dd>
  </div>
);

// props 타입 정의
interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestData: ExtendedApprovalRequest | null;
}

export function ApprovalRequestDialog({
  open,
  onOpenChange,
  requestData,
}: ApprovalRequestDialogProps) {
  if (!requestData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl">
        <DialogHeader className="p-6 pb-2">
          {/* 제목 변경 */}
          <DialogTitle className="text-2xl font-bold">
            결재 요청 상세
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 px-6 py-4">
          {/* 요청 상세 정보 섹션 */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">요청 정보</h3>
            <div className="border-t">
              {/* 레이블 한글화 */}
              <DetailItem label="기안자" value={requestData.createdBy.name} />
              <DetailItem
                label="기안일"
                value={formatDateTime(requestData.createdAt, {
                  includeTime: false,
                })}
              />
              <DetailItem label="요청 내용" value={requestData.content} />
            </div>
          </div>

          {/* 첨부파일 섹션 */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">첨부 파일</h3>
            <div className="flex flex-wrap gap-2">
              {requestData.attachments.map((file) => (
                <Badge
                  key={file.id}
                  variant="secondary"
                  className="cursor-pointer px-3 py-1.5 text-sm font-normal"
                >
                  {file.fileName}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t bg-slate-50 p-4 sm:justify-end">
          {/* 버튼 텍스트 한글화 */}
          <Button type="button" variant="secondary">
            반려
          </Button>
          <Button type="button">승인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
