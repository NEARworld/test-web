// types/document.ts
export enum DocumentStatus {
  DRAFT = "DRAFT", // 임시저장 (내가 기안한 문서 중 아직 제출 전)
  PENDING = "PENDING", // 결재 대기
  APPROVED = "APPROVED", // 완료 (승인)
  REJECTED = "REJECTED", // 완료 (반려)
}

export interface Approver {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  order: number;
  comment?: string;
  approvedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  authorId: string; // 기안자 ID
  authorName: string;
  status: DocumentStatus;
  createdAt: string;
  approvers: Approver[];
}
