"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Department } from "@/constants/department";
import { JobPosition } from "@/constants/jobPosition";

export async function updateEmployeeDepartment(formData: FormData) {
  const session = await auth();
  const currentUserPosition = session?.user?.position || "unknown";

  // Only allow users with positions other than staff or unknown to update
  if (["staff", "unknown"].includes(currentUserPosition)) {
    console.error("Permission denied: User cannot update employee department");
    throw new Error("권한이 없습니다");
  }

  const employeeId = formData.get("employeeId") as string;
  const department = formData.get("department") as string;

  try {
    await prisma.user.update({
      where: { id: employeeId },
      data: { department: department as Department },
    });
  } catch (error) {
    console.error("Failed to update employee department:", error);
    throw new Error("부서 업데이트에 실패했습니다");
  }
}

export async function updateEmployeePosition(formData: FormData) {
  const session = await auth();
  const currentUserPosition = session?.user?.position || "unknown";

  // Only allow users with positions other than staff or unknown to update
  if (["staff", "unknown"].includes(currentUserPosition)) {
    console.error("Permission denied: User cannot update employee position");
    throw new Error("권한이 없습니다");
  }

  const employeeId = formData.get("employeeId") as string;
  const position = formData.get("position") as string;

  try {
    await prisma.user.update({
      where: { id: employeeId },
      data: { position: position as JobPosition },
    });
  } catch (error) {
    console.error("Failed to update employee position:", error);
    throw new Error("직급 업데이트에 실패했습니다");
  }
}
