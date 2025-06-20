import { ApprovalRequest, ApprovalStatus, User } from "@prisma/client";

export interface ExtendedApprovalRequest extends ApprovalRequest {
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  attachments: {
    id: string;
    name: string;
  }[];
  steps: {
    id: string;
    approver: User;
    stepOrder: number;
    status: ApprovalStatus;
  }[];
}

export const statusToKoreanMap: Record<ApprovalStatus, string> = {
  PENDING: "대기중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELED: "취소",
};

export function getKoreanStatus(status: ApprovalStatus): string {
  return statusToKoreanMap[status];
}

export const getBadgeVariant = (
  status: ApprovalStatus,
): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case "PENDING":
      return "secondary"; // 노란색 계열을 원하면 custom variant 필요
    case "APPROVED":
      return "success"; // 녹색 배지로 변경
    case "REJECTED":
      return "destructive";
    case "CANCELED":
      return "outline";
    default:
      return "outline";
  }
};

// steps 배열에서 pending 상태인 step의 stepOrder를 확인하여 표시할 텍스트 반환
export const getCurrentStepText = (
  steps: ExtendedApprovalRequest["steps"],
): string => {
  const pendingStep = steps.find((step) => step.status === "PENDING");
  if (pendingStep) {
    return `${pendingStep.stepOrder}차 결재 진행중`;
  }

  // 모든 step이 완료된 경우 (승인 또는 반려)
  const allApproved = steps.every((step) => step.status === "APPROVED");
  const hasRejected = steps.some((step) => step.status === "REJECTED");

  if (allApproved) {
    return "승인";
  } else if (hasRejected) {
    return "반려";
  }

  return "대기중";
};
