import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );

    // 해당 연도의 모든 예약 데이터 조회
    const reservations = await prisma.reservation.findMany({
      where: {
        dateTime: {
          gte: new Date(year, 0, 1), // 해당 연도의 1월 1일
          lt: new Date(year + 1, 0, 1), // 다음 연도의 1월 1일
        },
        status: "CONFIRMED", // 확정된 예약만
      },
      select: {
        dateTime: true,
      },
    });

    // 월별 통계 데이터 생성
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthStart = new Date(year, i, 1);
      const monthEnd = new Date(year, i + 1, 0);

      // 해당 월의 예약 수 계산
      const totalReservations = reservations.filter(
        (reservation) =>
          reservation.dateTime >= monthStart &&
          reservation.dateTime <= monthEnd,
      ).length;

      return {
        month: `${month}월`,
        totalReservations,
      };
    });

    return NextResponse.json({ monthlyStats });
  } catch (error) {
    console.error("Error fetching yearly statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch yearly statistics" },
      { status: 500 },
    );
  }
}
