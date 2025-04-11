import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // prisma 클라이언트

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, assignee, dueDate } = body;

    console.log(body);

    const newTask = await prisma.task.create({
      data: {
        title,
        assignee: {
          connect: { id: assignee }, // 또는 id로 연결할 수도 있음
        },
        dueDate: new Date(dueDate),
        status: "INCOMPLETE",
      },
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (err) {
    console.error("Task creation error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid input or DB error" },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit: string | null | number = searchParams.get("limit");
  const page: string | null | number = searchParams.get("page");

  const verifiedPage = page ? parseInt(page, 10) : 1;
  const verifiedLimit = limit ? parseInt(limit, 10) : 1;

  const skip = (verifiedPage - 1) * verifiedLimit;

  const totalTasks = await prisma.task.count();

  console.log(limit, page, skip);

  const tasks = await prisma.task.findMany({
    skip,
    take: verifiedLimit,
    include: {
      assignee: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return NextResponse.json({ tasks, totalTasks });
}
