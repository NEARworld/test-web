import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";
import { ApprovalStatus } from "@prisma/client";

// POST 요청 처리
export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 },
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const files = formData.getAll("files") as File[];

    if (!title) {
      return NextResponse.json({ error: "제목은 필수입니다" }, { status: 400 });
    }

    // 결재 ID 생성
    const approvalId = uuidv4();

    // 파일 업로드 처리
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileId = uuidv4();
        const fileExtension = file.name.split(".").pop();
        const fileName = `${fileId}.${fileExtension}`;
        const filePath = `approvals/${fileName}`;

        // Supabase Storage에 파일 업로드
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`파일 업로드 실패: ${uploadError.message}`);
        }

        return {
          id: fileId,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
        };
      }),
    );

    // 결재 데이터 저장
    const firstApprover = await prisma.user.findFirst({
      where: {
        position: "CEO",
      },
    });

    if (!firstApprover) {
      return NextResponse.json(
        { error: "최초 결재자를 찾을 수 없습니다" },
        { status: 400 },
      );
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        id: approvalId,
        title,
        content,
        status: "PENDING",
        createdBy: {
          connect: { id: session.user.id },
        },
        attachments: {
          create: uploadedFiles.map((file) => ({
            id: file.id,
            name: file.name,
            path: file.path,
            size: file.size,
            type: file.type,
          })),
        },
        steps: {
          create: {
            stepOrder: 1,
            approverId: firstApprover.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "결재가 생성되었습니다",
        approvalId: approval.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("결재 생성 중 오류 발생:", error);

    return NextResponse.json(
      {
        error: "결재 생성에 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}

// GET 요청 처리
export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 },
      );
    }

    // URL에서 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 쿼리 조건 구성
    const where = status
      ? { status: status.toUpperCase() as ApprovalStatus }
      : {};

    // 데이터 조회
    const [data, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        include: {
          attachments: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          steps: {
            select: {
              approver: true,
              stepOrder: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.approvalRequest.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("결재 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      {
        error: "결재 목록 조회에 실패했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}
