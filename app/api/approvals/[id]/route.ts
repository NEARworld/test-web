import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { JobPosition } from "@prisma/client";

const approvers = ["CEO", "CHAIRPERSON"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "APPROVAL ID is required" },
      { status: 400 },
    );
  }

  const { status, processedById, processorPosition } = await request.json();

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
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 해당 전자 결재에 대한 모든 결재 단계 조회
        const approvalSteps = await tx.approvalStep.findMany({
          where: {
            approvalRequestId: id,
          },
          include: {
            approver: true,
          },
        });

        if (approvalSteps.length === 0) {
          throw new Error("결재 단계를 찾을 수 없습니다.");
        }

        // 마지막 결재 단계 조회
        const lastStep = approvalSteps[approvalSteps.length - 1];

        // 이사장 결재 승인 시 전자 결재 상태 승인으로 변경
        if (lastStep.approver.position === "CHAIRPERSON") {
          // 현재 결재 단계 업데이트
          const updatedStep = await tx.approvalStep.update({
            where: { id: lastStep.id },
            data: {
              status: "APPROVED",
              processedById,
              processedAt: new Date(),
            },
          });

          // 전자 결재 요청 상태 업데이트
          const approvalRequest = await tx.approvalRequest.update({
            where: { id },
            data: {
              status: "APPROVED",
              approvedById: processedById,
              approvedAt: new Date(),
            },
          });

          return { approvalRequest, approvalStep: updatedStep };
        } else {
          // 다음 결재 단계 생성 - 수정된 로직
          const nextApproverIndex = currentApprovalStepOrder; // 현재 단계 다음 단계

          // 배열 범위 체크
          if (nextApproverIndex >= approvers.length) {
            throw new Error("더 이상 다음 결재자가 없습니다.");
          }

          const nextApprover = await tx.user.findFirst({
            where: {
              position: approvers[nextApproverIndex] as JobPosition,
            },
          });

          if (!nextApprover) {
            throw new Error("다음 결재자를 찾을 수 없습니다.");
          }

          // 현재 결재 단계 업데이트
          const updatedStep = await tx.approvalStep.update({
            where: { id: lastStep.id },
            data: {
              status: "APPROVED",
              processedById,
              processedAt: new Date(),
            },
          });

          // 다음 결재 단계 생성
          const nextStep = await tx.approvalStep.create({
            data: {
              approvalRequestId: id,
              approverId: nextApprover.id,
              stepOrder: lastStep.stepOrder + 1,
              status: "PENDING",
            },
          });

          return { approvalRequest: null, approvalStep: updatedStep, nextStep };
        }
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error("Approval transaction failed:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "결재 처리 중 오류가 발생했습니다.",
        },
        { status: 500 },
      );
    }
  }

  // APPROVED를 제외한 결재 상태 업데이트 (REJECTED, CANCELED)
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 현재 결재 단계 찾기
      const currentStep = await tx.approvalStep.findFirst({
        where: {
          approvalRequestId: id,
          approverId: processedById,
          status: "PENDING",
        },
        orderBy: {
          stepOrder: "desc",
        },
      });

      if (!currentStep) {
        throw new Error("처리할 결재 단계를 찾을 수 없습니다.");
      }

      // 결재 단계 업데이트
      const updatedStep = await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: {
          status,
          processedById,
          processedAt: new Date(),
        },
      });

      // 전자 결재 요청 상태 업데이트
      const approvalRequest = await tx.approvalRequest.update({
        where: { id },
        data: { status },
      });

      return { approvalRequest, approvalStep: updatedStep };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rejection transaction failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "결재 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
