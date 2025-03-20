import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    const date = new Date(dateStr);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // 해당 월의 모든 예약 조회
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfMonth.toISOString(),
          lte: endOfMonth.toISOString(),
        },
      },
      include: {
        menuItems: true,
      },
    });

    // 메뉴별 예약 수 집계
    const menuStats = reservations.reduce(
      (acc: { [key: string]: number }, reservation) => {
        reservation.menuItems.forEach((item) => {
          acc[item.name] = (acc[item.name] || 0) + 1;
        });
        return acc;
      },
      {},
    );

    // 결과를 배열 형태로 변환
    const result = Object.entries(menuStats).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({ menuStats: result });
  } catch (error) {
    console.error("Error fetching menu statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu statistics" },
      { status: 500 },
    );
  }
}
