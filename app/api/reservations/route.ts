// app/api/reservation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ReservationStatus } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication using App Router auth
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    // Create date range for the requested date (full day)
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Query reservations for the specified date
    const reservations = await prisma.reservation.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate,
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication using App Router auth
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 401 },
      );
    }

    // Parse request body
    const data = await request.json();
    const { groupName, totalPeople, dateTime, seatNumber, menuItems, status } =
      data;

    // Validate required fields
    if (!groupName || !totalPeople || !dateTime || !seatNumber || !menuItems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if seat is already booked for the given time
    const reservationTime = new Date(dateTime);
    // Calculate a time window (e.g., +/- 2 hours) to prevent overlapping reservations
    const timeWindowStart = new Date(reservationTime);
    const timeWindowEnd = new Date(reservationTime);
    timeWindowStart.setHours(timeWindowStart.getHours() - 2);
    timeWindowEnd.setHours(timeWindowEnd.getHours() + 2);

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        seatNumber,
        dateTime: {
          gte: timeWindowStart,
          lte: timeWindowEnd,
        },
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        {
          error: "This seat is already reserved for the selected time window",
        },
        { status: 409 },
      );
    }

    // Create the reservation with related menu items in a transaction
    const reservation = await prisma.$transaction(async (tx) => {
      // Create the reservation
      const newReservation = await tx.reservation.create({
        data: {
          groupName,
          totalPeople,
          dateTime: reservationTime,
          seatNumber,
          status: (status as ReservationStatus) || "CONFIRMED",
          createdById: userId,
        },
      });

      // Create menu items for the reservation
      for (const item of menuItems) {
        await tx.menuItem.create({
          data: {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            reservationId: newReservation.id,
          },
        });
      }

      // Return the created reservation
      return newReservation;
    });

    // Fetch the complete reservation with included relations
    const completeReservation = await prisma.reservation.findUnique({
      where: {
        id: reservation.id,
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

    return NextResponse.json(completeReservation, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 },
    );
  }
}
