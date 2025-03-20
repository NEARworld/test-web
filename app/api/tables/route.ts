import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, number, position } = body;

    const table = await prisma.table.create({
      data: {
        id,
        seats: 0,
        number: number,
        positionX: position.x,
        positionY: position.y,
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, position } = body;

    const table = await prisma.table.update({
      where: { id },
      data: {
        positionX: position.x,
        positionY: position.y,
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { error: "Failed to update table" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // include를 사용하여 테이블에 연결된 예약 정보도 함께, 오늘 날짜로 필터링
    const today = new Date().toISOString().split("T")[0];
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const tables = await prisma.table.findMany({
      include: {
        reservations: {
          where: {
            dateTime: {
              gte: todayStart,
              lte: todayEnd,
            },
            status: "CONFIRMED",
          },
        },
      },
    });

    // 프론트엔드에서 사용하기 쉽게 데이터 구조 변환
    const formattedTables = tables.map((table) => {
      const activeReservation = table.reservations[0]; // 오늘 날짜의 첫 번째 예약

      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        positionX: table.positionX,
        positionY: table.positionY,
        status: table.status,
        reservationId: activeReservation ? activeReservation.id : null,
        reservation: activeReservation || null,
      };
    });

    return NextResponse.json(formattedTables);
  } catch (error) {
    console.error("테이블 목록을 가져오는데 실패했습니다:", error);
    return NextResponse.json(
      { error: "테이블 목록을 가져오는데 실패했습니다." },
      { status: 500 },
    );
  }
}
