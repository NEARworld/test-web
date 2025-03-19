import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, number, position } = body;

    const table = await prisma.table.create({
      data: {
        id,
        seats: 0,
        number: number,
        positionX: position.x,
        positionY: position.y,
      },
    });

    return NextResponse.json(table);
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
    const tables = await prisma.table.findMany();
    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 },
    );
  }
}
