import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (session?.user.role !== "ADMIN" || session?.user.position !== "CEO") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { hireDate, resignationDate, position, department, status } =
    await request.json();

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { hireDate, resignationDate, position, department, status },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
