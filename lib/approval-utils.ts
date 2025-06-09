export interface ApprovalAttachment {
  id: string;
  fileName: string;
}

export interface ApprovalRequest {
  id: string;
  requester: string;
  submissionDate: string;
  description: string;
  attachments: ApprovalAttachment[];
}

// 이미지에 보이는 내용을 바탕으로 한 목데이터
export const mockApprovalRequest: ApprovalRequest = {
  id: "req_7a8f6c5d",
  requester: "이든 카터", // 또는 '마케팅팀 이든'과 같이 소속을 포함할 수 있습니다.
  submissionDate: "2024년 7월 26일",
  description:
    "차기 마케팅 캠페인 진행을 위해 첨부된 문서를 검토 후 승인 부탁드립니다. 본 문서에는 프로젝트의 최종 예산안과 전체 일정이 포함되어 있습니다. 원활한 프로젝트 진행을 위해 신속한 승인을 부탁드립니다.",
  attachments: [
    { id: "att_001", fileName: "마케팅_캠페인_예산안.pdf" },
    { id: "att_002", fileName: "프로젝트_타임라인.xlsx" },
  ],
};

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
