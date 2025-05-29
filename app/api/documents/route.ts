import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { BoardType } from "@prisma/client";

export async function GET(request: NextRequest) {
  // 쿼리 파라미터에서 boardType 값을 가져옴
  const { searchParams } = new URL(request.url);
  const boardTypeParam = searchParams.get("boardType");

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
    },
  });
  return NextResponse.json(documents);
}

// POST 요청: 새 Document 생성
export async function POST(request: NextRequest) {
  //  요청 body에서 데이터 파싱
  const body = await request.json();
  const {
    title,
    description,
    fileName,
    fileType,
    fileUrl,
    createdById,
    boardType,
  } = body;

  // 필수값 체크
  if (!title || !boardType) {
    return NextResponse.json(
      { error: "title, boardType 필수" },
      { status: 400 },
    );
  }
  if (!Object.values(BoardType).includes(boardType)) {
    return NextResponse.json(
      { error: "유효하지 않은 boardType" },
      { status: 400 },
    );
  }

  try {
    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName,
        fileType,
        fileUrl,
        createdById,
        boardType,
      },
    });
    // 생성된 document 반환
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    //  에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
