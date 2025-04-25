import { NextRequest, NextResponse } from "next/server";
import { Prisma, $Enums } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { validateUserInDB } from "@/lib/auth-utils";

interface MenuItem {
  name: string;
  price: number;
  quantity: number;
}

export async function GET(request: NextRequest) {
  try {
    // App Router auth를 사용하여 인증 확인
    const session = await auth();

    // DB에 유효한 사용자 정보가 있는지 확인
    const isValidUser = await validateUserInDB(session);
    if (!session || !isValidUser) {
      return NextResponse.json(
        { error: "Unauthorized", redirectToLogin: true },
        { status: 401 },
      );
    }

    // 쿼리 매개변수 가져오기
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status") as $Enums.ReservationStatus; // 상태 매개변수가 있는 경우

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
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
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // DB에 유효한 사용자 정보가 있는지 확인
    const isValidUser = await validateUserInDB(session);
    if (!session?.user?.id || !isValidUser) {
      return NextResponse.json(
        { message: "Unauthorized", redirectToLogin: true },
        { status: 401 },
      );
    }

    const data = await req.json();
    const { groupName, dateTime, seatNumber, menuItems } = data;

    // 기본 유효성 검사
    if (!groupName || !dateTime || !seatNumber || !menuItems) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // 날짜 문자열 생성 (YYYY-MM-DD 형식)
    const date = new Date(dateTime).toISOString().split("T")[0];

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
    return NextResponse.json(
      { message: "Failed to create reservation" },
      { status: 500 },
    );
  }
}
