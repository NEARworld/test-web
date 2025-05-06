import { NextRequest, NextResponse } from "next/server";
import { Prisma, $Enums } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { validateUserInDB } from "@/lib/auth-utils";
import { toISODateString } from "@/lib/date-utils";

interface MenuItem {
  name: string;
  price: number;
  quantity: number;
}

// 에러 응답 생성 함수
function createErrorResponse(
  message: string,
  status: number,
  redirectToLogin = false,
) {
  return NextResponse.json(
    { error: message, ...(redirectToLogin ? { redirectToLogin } : {}) },
    { status },
  );
}

export async function GET(request: NextRequest) {
  try {
    // App Router auth를 사용하여 인증 확인
    const session = await auth();

    // DB에 유효한 사용자 정보가 있는지 확인
    const isValidUser = await validateUserInDB(session);
    if (!session || !isValidUser) {
      return createErrorResponse("Unauthorized", 401, true);
    }

    // 쿼리 매개변수 가져오기
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status") as $Enums.ReservationStatus; // 상태 매개변수가 있는 경우

    if (!date) {
      return createErrorResponse("Date parameter is required", 400);
    }

    // 요청된 날짜에 대한 날짜 범위 생성 (하루 전체)
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // 날짜 범위를 사용하여 조건 생성
    const whereClause: Prisma.ReservationWhereInput = {
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 상태 필터가 제공되면 추가
    if (status) {
      whereClause.status = status;
    }

    // 쿼리 예약 생성 조건
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        menuItems: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return createErrorResponse("Failed to fetch reservations", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // DB에 유효한 사용자 정보가 있는지 확인
    const isValidUser = await validateUserInDB(session);
    if (!session?.user?.id || !isValidUser) {
      return createErrorResponse("Unauthorized", 401, true);
    }

    const data = await req.json();
    const { groupName, dateTime, seatNumber, menuItems } = data;

    // 기본 유효성 검사
    if (!groupName || !dateTime || !seatNumber || !menuItems) {
      return createErrorResponse("Missing required fields", 400);
    }

    // 날짜 문자열 생성 (YYYY-MM-DD 형식) - 유틸리티 함수 사용
    const date = toISODateString(dateTime);

    // 트랜잭션으로 예약과 통계를 함께 처리
    const reservation = await prisma.$transaction(async (tx) => {
      // 1. 해당 날짜의 통계 데이터 upsert
      await tx.dailyReservationStats.upsert({
        where: {
          date: date,
        },
        create: {
          date: date,
          totalReservations: 1,
        },
        update: {
          totalReservations: {
            increment: 1,
          },
        },
      });

      // 2. 예약 생성
      const newReservation = await tx.reservation.create({
        data: {
          groupName,
          dateTime: new Date(dateTime),
          seatNumber,
          status: "CONFIRMED",
          createdById: session.user.id,
          date: date, // DailyReservationStats와 연결할 날짜
          menuItems: {
            create: menuItems.map((item: MenuItem) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          menuItems: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      });

      return newReservation;
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Reservation creation error:", error);
    return createErrorResponse("Failed to create reservation", 500);
  }
}
