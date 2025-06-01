import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error("사용자 정보를 가져오는 중 에러 발생:", error);
    return NextResponse.json(
      { error: "서버에서 사용자 정보를 가져오는데 실패했습니다." },
      { status: 500 },
    );
  }
}
