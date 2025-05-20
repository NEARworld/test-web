import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const userData = session?.user;

  try {
    if (userData?.id) {
      const user = await prisma.user.findUnique({
        where: {
          id: userData.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          position: true,
          department: true,
        },
      });

      return NextResponse.json(user);
    }
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
