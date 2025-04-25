import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const userData = user
      ? {
          id: user.id,
          name: user.name,
          role: user.role,
          ...(user.position && { position: user.position }),
          ...(user.department && { department: user.department }),
        }
      : null;

    return NextResponse.json({
      valid: !!user,
      user: userData,
    });
  } catch (error) {
    console.error("사용자 검증 오류:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
