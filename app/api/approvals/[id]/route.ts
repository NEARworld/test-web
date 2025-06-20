import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const approvers = ["CEO", "CHAIRPERSON"];

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const approvalRequestId = searchParams.get("id");

  if (!approvalRequestId) {
    return NextResponse.json(
      { error: "APPROVAL ID is required" },
      { status: 400 },
    );
  }

  const { status, processorPosition } = await request.json();

  // approvers 배열에서 해당 포지션의 인덱스 찾기
  const currentApprovalStepOrder = approvers.indexOf(processorPosition) + 1;

  if (currentApprovalStepOrder === 0) {
    return NextResponse.json(
      { error: "Invalid processor position" },
      { status: 400 },
    );
  }

  // 결재 승인 처리
  if (status === "APPROVED") {
    // 해당 전자 결재에 대한 모든 결재 단계 조회
    const approvalSteps = await prisma.approvalStep.findMany({
      where: {
        approvalRequestId,
      },
      include: {
        approver: true,
      },
    });
    // 마지막 결재 단계 조회
    const lastStep = approvalSteps[approvalSteps.length - 1];

    // 이사장 결재 승인 시 전자 결재 상태 승인으로 변경
    if (lastStep.approver.position === "CHAIRPERSON") {
      const approvalRequest = await prisma.approvalRequest.update({
        where: { id: approvalRequestId },
        data: { status: "APPROVED" },
      });

      return NextResponse.json(approvalRequest);
    } else {
      // 다음 결재 단계 생성
      const nextApprover = await prisma.user.findFirst({
        where: {
          position: "CHAIRPERSON",
        },
      });

      if (!nextApprover) {
        return NextResponse.json(
          { error: "다음 결재자를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      const nextStep = await prisma.approvalStep.create({
        data: {
          approvalRequestId,
          approverId: nextApprover!.id,
          stepOrder: lastStep.stepOrder + 1,
        },
      });

      return NextResponse.json(nextStep);
    }
  }

  return NextResponse.json({ message: "Approval request updated" });
}
