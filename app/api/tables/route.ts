import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TableFromApi } from "@/app/dashboard/tables/page";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seats, positionX, positionY } = body as TableFromApi;

    const result = await prisma.$transaction(async (tx) => {
      // Find the highest current table number
      const maxNumberResult = await tx.table.aggregate({
        _max: {
          number: true,
        },
      });

      console.log(maxNumberResult);
      const nextNumber = (maxNumberResult._max.number || 0) + 1;

      // Create the new table with the calculated number
      const newTable = await tx.table.create({
        data: {
          // id: id, // Let Prisma generate the ID unless you have specific needs
          number: nextNumber, // Use the calculated number
          seats: seats,
          positionX: positionX,
          positionY: positionY,
          // Add other necessary fields like userId if applicable
        },
      });
      return newTable;
    });

    return NextResponse.json(result);
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
