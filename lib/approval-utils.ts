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
