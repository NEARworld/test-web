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
      ? { boardType: boardTypeParam as BoardType }
      : undefined,
  });
  return NextResponse.json(documents);
}
