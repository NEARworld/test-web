export interface ApprovalItem {
  id: string;
  request: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  requestedOn: string;
  action: "Approve" | "View";
}

export const statusToKoreanMap: Record<ApprovalItem["status"], string> = {
  Pending: "대기중",
  Approved: "승인",
  Rejected: "반려",
};

export function getKoreanStatus(status: ApprovalItem["status"]): string {
  return statusToKoreanMap[status];
}
