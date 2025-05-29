import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { BoardType } from "@prisma/client";
import { uploadFileToSupabaseStorage } from "@/lib/document-utils";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  // 쿼리 파라미터에서 boardType 값을 가져옴
  const { searchParams } = new URL(request.url);
  const boardTypeParam = searchParams.get("boardType")?.toUpperCase();

  // boardType이 enum 값에 해당하는지 체크
  const isValidBoardType =
    boardTypeParam &&
    Object.values(BoardType).includes(boardTypeParam as BoardType);

  // 유효한 enum 값이면 해당 게시판 자료만 조회, 아니면 전체 조회
  const documents = await prisma.document.findMany({
    where: isValidBoardType
      ? { boardType: boardTypeParam as BoardType, isDeleted: false }
      : { isDeleted: false },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: true,
      _count: {
        select: {
          attachments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다. 로그인 후 다시 시도해주세요." },
        { status: 401 },
      );
    }
    const createdById = session.user.id;

    const formData = await request.formData();
    console.log(formData);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string | null;
    const boardType = formData
      .get("boardType")
      ?.toString()
      .toUpperCase() as BoardType;

    if (!title || !boardType) {
      return NextResponse.json(
        { error: "제목(title)과 게시판 종류(boardType)는 필수입니다." },
        { status: 400 },
      );
    }

    if (!Object.values(BoardType).includes(boardType)) {
      return NextResponse.json(
        { error: "유효하지 않은 boardType입니다." },
        { status: 400 },
      );
    }

    const document = await prisma.document.create({
      data: {
        title,
        description: content,
        boardType,
        createdById,
      },
    });

    const files = formData.getAll("files") as File[];
    const uploadedFileRecords = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file instanceof File && file.size > 0) {
          const uploadResult = await uploadFileToSupabaseStorage(file);

          if (uploadResult.error) {
            console.error(
              `Supabase 파일 업로드 실패: ${file.name}, 오류: ${uploadResult.error}`,
            );
            continue;
          }

          const attachment = await prisma.attachment.create({
            data: {
              fileName: uploadResult.fileName,
              fileType: uploadResult.fileType,
              fileUrl: uploadResult.fileUrl,
              documentId: document.id,
            },
          });

          uploadedFileRecords.push(attachment);
        } else if (file instanceof File && file.size === 0) {
          console.warn(`Skipping empty file: ${file.name}`);
        }
      }
    }

    return NextResponse.json(
      { ...document, attachments: uploadedFileRecords },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating document:", error);
    if (error instanceof Error && error.message.includes("prisma")) {
      return NextResponse.json(
        {
          error: "데이터베이스 처리 중 에러가 발생했습니다.",
          details: error.message,
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      {
        error: "문서 생성 중 서버 내부 오류가 발생했습니다.",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

// PATCH 요청: 기존 Document 수정
export async function PATCH(request: NextRequest) {
  // 요청 body에서 데이터 파싱
  const body = await request.json();
  const { id, ...updateData } = body;

  // id 필수값 체크
  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  // boardType이 있으면 유효성 체크
  if (
    updateData.boardType &&
    !Object.values(BoardType).includes(updateData.boardType)
  ) {
    return NextResponse.json(
      { error: "유효하지 않은 boardType" },
      { status: 400 },
    );
  }

  try {
    // document 수정
    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
    });
    // 수정된 document 반환
    return NextResponse.json(updated);
  } catch (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE 요청: 기존 Document 삭제 (isDeleted 필드를 true로 변경)
export async function DELETE(request: NextRequest) {
  // 요청 body에서 데이터 파싱
  const body = await request.json();
  const { id } = body;

  // id 필수값 체크
  if (!id) {
    return NextResponse.json({ error: "id 필수" }, { status: 400 });
  }

  try {
    // document의 isDeleted 필드를 true로 변경
    const updated = await prisma.document.update({
      where: { id },
      data: { isDeleted: true },
    });
    // 변경된 document 반환
    return NextResponse.json(updated);
  } catch (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
