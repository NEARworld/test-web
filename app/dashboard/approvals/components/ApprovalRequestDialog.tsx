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
import { useSession } from "next-auth/react";
import { useState } from "react";

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
  const { data: session } = useSession();
  const user = session?.user;
  const [isLoading, setIsLoading] = useState(false);

  if (!requestData) {
    return null;
  }

  // 현재 사용자가 결재자인지 확인
  const isCurrentApprover = requestData.steps.some(
    (step) => step.approver.id === user?.id,
  );

  // 현재 사용자가 결재할 수 있는 단계인지 확인 (PENDING 상태인 단계)
  const canApprove = requestData.steps.some(
    (step) => step.approver.id === user?.id && step.status === "PENDING",
  );

  // 현재 사용자의 결재 단계 정보
  const currentUserStep = requestData.steps.find(
    (step) => step.approver.id === user?.id,
  );

  const handleApprove = async () => {
    if (!user?.id) {
      alert("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/approvals/${requestData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
          processedById: user.id,
          processorPosition: user.position,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "승인 처리 중 오류가 발생했습니다.");
      }

      const result = await response.json();
      console.log("승인 성공:", result);

      // 성공 시 다이얼로그 닫기
      onOpenChange(false);

      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error("승인 처리 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "승인 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl">
        <DialogHeader className="p-6 pb-2">
          {/* 제목 변경 */}
          <DialogTitle className="text-2xl font-bold">
            {requestData.title}
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
              <DetailItem
                label="결재자"
                value={
                  requestData.steps[requestData.steps.length - 1].approver.name!
                }
              />
            </div>
          </div>

          {/* 첨부파일 섹션 */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">첨부 파일</h3>
            <div className="flex flex-wrap gap-2">
              {/* 첨부파일 뱃지를 클릭하면 다운로드가 되도록 a 태그로 감쌈 */}
              {requestData.attachments.map((file) => (
                <a
                  key={file.id}
                  href={`/api/attachments/${file.id}`}
                  download={file.name}
                  // 새 탭에서 열리지 않도록 target, rel 생략
                  className="no-underline"
                >
                  {/* Badge 컴포넌트로 파일명 표시 */}
                  <Badge
                    variant="secondary"
                    className="cursor-pointer px-3 py-1.5 text-sm font-normal"
                  >
                    {file.name}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t bg-slate-50 p-4 sm:justify-end">
          {/* 결재 권한이 없을 때 안내 메시지 */}
          {!isCurrentApprover && (
            <div className="text-muted-foreground mr-auto text-sm">
              이 결재의 결재자가 아닙니다.
            </div>
          )}

          {/* 결재할 수 있는 상태가 아닐 때 안내 메시지 */}
          {isCurrentApprover && !canApprove && currentUserStep && (
            <div className="text-muted-foreground mr-auto text-sm">
              {currentUserStep.status === "APPROVED"
                ? "이미 승인 처리된 결재입니다."
                : currentUserStep.status === "REJECTED"
                  ? "이미 반려 처리된 결재입니다."
                  : "이미 처리된 결재입니다."}
            </div>
          )}

          {/* 버튼 텍스트 한글화 */}
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || !canApprove}
          >
            반려
          </Button>
          <Button
            type="button"
            variant="blue"
            className="cursor-pointer"
            onClick={handleApprove}
            disabled={isLoading || !canApprove}
          >
            {isLoading ? "처리 중..." : "승인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
