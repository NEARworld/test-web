import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // 데이터베이스 연결 (prisma 또는 다른 ORM 가정)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "테이블 ID가 필요합니다" },
        { status: 400 },
      );
    }

    // 데이터베이스에서 테이블 업데이트
    const updatedTable = await prisma.table.update({
      where: { id },
      data,
    });

    if (!updatedTable) {
      return NextResponse.json(
        { error: "테이블을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, updatedTable }, { status: 200 });
  } catch (error) {
    console.error("테이블 업데이트 중 오류 발생:", error);
    return NextResponse.json(
      { error: "테이블 업데이트 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
