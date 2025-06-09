export interface ApprovalAttachment {
  id: string;
  fileName: string;
}

export interface ApprovalRequest {
  id: string;
  requester: string;
  approver: string;
  submissionDate: string;
  title: string;
  description: string;
  attachments: ApprovalAttachment[];
  status: "Pending" | "Approved" | "Rejected";
}

// 이미지에 보이는 내용을 바탕으로 한 목데이터
export const mockApprovalRequest: ApprovalRequest[] = [
  {
    id: "1",
    requester: "김철수",
    approver: "이영희",
    submissionDate: "2024년 7월 26일",
    title: "마케팅 캠페인 예산안",
    description:
      "차기 마케팅 캠페인 진행을 위해 첨부된 문서를 검토 후 승인 부탁드립니다. 본 문서에는 프로젝트의 최종 예산안과 전체 일정이 포함되어 있습니다. 원활한 프로젝트 진행을 위해 신속한 승인을 부탁드립니다.",
    attachments: [
      { id: "att_001", fileName: "마케팅_캠페인_예산안.pdf" },
      { id: "att_002", fileName: "프로젝트_타임라인.xlsx" },
    ],
    status: "Pending",
  },
  {
    id: "2",
    requester: "이영희",
    approver: "김철수",
    submissionDate: "2024년 7월 26일",
    title: "프로젝트 타임라인",
    description:
      "차기 마케팅 캠페인 진행을 위해 첨부된 문서를 검토 후 승인 부탁드립니다. 본 문서에는 프로젝트의 최종 예산안과 전체 일정이 포함되어 있습니다. 원활한 프로젝트 진행을 위해 신속한 승인을 부탁드립니다.",
    attachments: [
      { id: "att_001", fileName: "마케팅_캠페인_예산안.pdf" },
      { id: "att_002", fileName: "프로젝트_타임라인.xlsx" },
    ],
    status: "Pending",
  },
];

export interface ApprovalItem {
  id: string;
  request: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedBy: string;
  requestedOn: string;
}

export const statusToKoreanMap: Record<ApprovalItem["status"], string> = {
  Pending: "대기중",
  Approved: "승인",
  Rejected: "반려",
};

export function getKoreanStatus(status: ApprovalItem["status"]): string {
  return statusToKoreanMap[status];
}

export const getBadgeVariant = (
  status: ApprovalItem["status"],
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Pending":
      return "secondary"; // 노란색 계열을 원하면 custom variant 필요
    case "Approved":
      return "default"; // 초록색 계열을 원하면 custom variant 필요 (기본은 primary 색상)
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
};
