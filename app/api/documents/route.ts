import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { BoardType } from "@prisma/client";

// Supabase 클라이언트 초기화 (환경 변수에서 URL 및 anon key를 가져옵니다)
// 실제 환경에서는 이 부분을 안전하게 관리해야 합니다.
// 예: const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
// 이 예제에서는 간단하게 플레이스홀더로 남겨둡니다. 실제 구현 시에는 Supabase 클라이언트를 적절히 초기화해야 합니다.
// import { supabase } from '@/lib/supabaseClient'; // 가정: Supabase 클라이언트가 별도 파일에 정의되어 있음

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
    },
  });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string | null;
    const boardType = formData.get("boardType") as BoardType;
    const createdById = formData.get("createdById") as string | null;

    if (!title || !boardType) {
      return NextResponse.json(
        { error: "제목(title)과 게시판 종류(boardType)는 필수입니다." },
        { status: 400 },
      );
    }

    if (!createdById) {
      return NextResponse.json(
        { error: "createdById가 제공되지 않았습니다." },
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
        ...(createdById && { createdById }),
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
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
