// app/api/reservation/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ReservationStatus } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication using App Router auth
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 },
      );
    }

    // Parse request body
    const data = await request.json();
    const { status } = data;

    if (!status || !Object.values(ReservationStatus).includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 },
      );
    }

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    // Update reservation status
    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status: status as ReservationStatus },
      include: {
        menuItems: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status" },
      { status: 500 },
    );
  }
}
