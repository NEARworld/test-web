import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Department, JobPosition, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");
  const department = searchParams.get("department") as Department | null;
  const position = searchParams.get("position") as JobPosition | null;

  try {
    const whereClause: Prisma.UserWhereInput = {};

    if (term) {
      whereClause.name = {
        contains: term,
        mode: "insensitive",
      };
    }

    if (department) {
      whereClause.department = department;
    }

    if (position) {
      whereClause.position = position;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search API error:", error);
    return NextResponse.json(
      { error: "사용자 검색 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
