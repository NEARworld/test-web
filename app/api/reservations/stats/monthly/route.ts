import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 쿼리 파라미터에서 날짜 가져오기
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    // 해당 월의 시작일과 마지막일 계산
    const targetDate = new Date(date);
    const firstDayOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const lastDayOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
    );

    // 해당 월의 모든 일별 통계 조회
    const monthlyStats = await prisma.dailyReservationStats.findMany({
      where: {
        date: {
          gte: firstDayOfMonth.toISOString().split("T")[0],
          lte: lastDayOfMonth.toISOString().split("T")[0],
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // 응답 데이터 구조화
    const response = {
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      totalReservations: monthlyStats.reduce(
        (sum, day) => sum + day.totalReservations,
        0,
      ),
      dailyStats: monthlyStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly statistics" },
      { status: 500 },
    );
  }
}
