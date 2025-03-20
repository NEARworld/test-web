import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { reservationId } = await request.json();

    // Validate the table exists
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // If reservationId is null, remove reservation connection
    if (reservationId === null || reservationId === "none") {
      // Find and update any reservations connected to this table
      await prisma.reservation.updateMany({
        where: { tableId: id },
        data: { tableId: null },
      });

      return NextResponse.json({ success: true });
    }

    // Validate the reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    // Update the reservation with the table connection
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { tableId: id },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating table reservation:", error);
    return NextResponse.json(
      { error: "Failed to update table reservation" },
      { status: 500 },
    );
  }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tableId = id;

    // Get reservations linked to this table
    const reservation = await prisma.reservation.findFirst({
      where: { tableId: tableId },
      select: { id: true },
    });

    if (!reservation) {
      return NextResponse.json({ reservationId: null });
    }

    return NextResponse.json({ reservationId: reservation.id });
  } catch (error) {
    console.error("Error fetching table reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch table reservation" },
      { status: 500 },
    );
  }
}
