import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    // 세션 확인 및 인증
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("인증되지 않은 사용자", { status: 401 });
    }

    // URL 파라미터에서 검색어 가져오기
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");

    if (!term) {
      return NextResponse.json([]);
    }

    // Prisma를 사용하여 Task 검색
    const tasks = await prisma.task.findMany({
      where: {
        isDeleted: false,
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { fileName: { contains: term, mode: "insensitive" } },
          {
            assignee: {
              name: { contains: term, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const tasksWithCreator = tasks.map((task) => ({
      ...task,
      creator: task.createdBy,
    }));

    // 결과 반환
    return NextResponse.json(tasksWithCreator);
  } catch (error) {
    console.error("검색 API 오류:", error);
    return new NextResponse("검색 중 오류가 발생했습니다", { status: 500 });
  }
}
