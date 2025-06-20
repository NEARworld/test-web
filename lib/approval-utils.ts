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
    approver: User;
    stepOrder: number;
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
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "PENDING":
      return "secondary"; // 노란색 계열을 원하면 custom variant 필요
    case "APPROVED":
      return "default"; // 초록색 계열을 원하면 custom variant 필요 (기본은 primary 색상)
    case "REJECTED":
      return "destructive";
    case "CANCELED":
      return "outline";
    default:
      return "outline";
  }
};
