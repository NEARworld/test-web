import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // 데이터베이스 연결 (prisma 또는 다른 ORM 가정)

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '테이블 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 데이터베이스에서 테이블 삭제
    const deletedTable = await prisma.table.delete({
      where: { id },
    });

    if (!deletedTable) {
      return NextResponse.json(
        { error: '테이블을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error) {
    console.error('테이블 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '테이블 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}