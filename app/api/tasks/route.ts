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

export async function GET() {
  const tasks = await prisma.task.findMany({
    include: {
      assignee: true,
    },
  });
  return NextResponse.json(tasks);
}
