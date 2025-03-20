// app/api/reservation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma, $Enums } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

interface MenuItem {
  name: string;
  price: number;
  quantity: number;
}

const prismaClient = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication using App Router auth
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status") as $Enums.ReservationStatus; // Get status parameter if present

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    // Create date range for the requested date (full day)
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Build the where clause with date range
    const whereClause: Prisma.ReservationWhereInput = {
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Query reservations with the constructed where clause
    const reservations = await prismaClient.reservation.findMany({
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
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
