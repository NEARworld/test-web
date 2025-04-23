// Assuming this file is located at something like: app/api/tasks/[taskId]/route.ts
import prisma from "@/lib/prisma"; // Your Prisma client import
import { NextRequest, NextResponse } from "next/server";
// import { getSession } from 'next-auth/react'; // Example: If using NextAuth for user ID
import { auth } from "@/auth"; // Example: If using Auth.js v5 / NextAuth.js v5

export async function PATCH(request: NextRequest) {
  const taskId = request.nextUrl.pathname.split("/").pop();

  // --- Authentication & Authorization (Placeholder) ---
  // In a real application, you would get the user ID from the session or token
  const session = await auth(); // Example using Auth.js v5
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  //   const userId = "clerk-or-auth0-or-session-user-id-placeholder"; // !! Replace with actual user ID retrieval !!
  // -----------------------------------------------------

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    // 1. Get the update data from the request body
    const updateData = await request.json();

    // Optional: Validate updateData here - ensure only allowed fields are present, etc.
    // Example: delete updateData.id; delete updateData.createdAt; etc.

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 },
      );
    }

    // 2. Fetch the current state of the task *before* the update
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    // Handle case where the task doesn't exist
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // --- Optional Authorization Check ---
    // Example: Check if the current user is allowed to modify this task
    // if (currentTask.assigneeId !== userId && currentTask.creatorId !== userId /* or some other role check */) {
    //     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }
    // ------------------------------------

    // 3. Perform the update and history creation in a transaction
    const transactionResult = await prisma.$transaction([
      // Create history record using the *current* data before the update
      prisma.taskModificationHistory.create({
        data: {
          taskId: taskId,
          modifiedById: userId,

          // Previous values (fetched above)
          previousTitle: currentTask.title,
          previousDescription: currentTask.description || null,
          previousStatus: currentTask.status,
          previousDueDate: currentTask.dueDate || null,
          previousAssigneeId: currentTask.assigneeId || null,
          previousFileUrl: currentTask.fileUrl || null,
          previousFileName: currentTask.fileName || null,
          previousFileType: currentTask.fileType || null,
          // Ensure your schema includes a modifiedAt field, Prisma handles it by default
        },
      }),

      // Update the task with the new data from the request body
      prisma.task.update({
        where: { id: taskId },
        data: {
          ...updateData,
          // You might want to explicitly set an updatedAt field if not automatically handled
          // updatedAt: new Date(),
        },
      }),
    ]);

    // The transaction returns an array with the results of each operation
    const updatedTask = transactionResult[1]; // The result of the second operation (task.update)

    // 4. Return the updated task data
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);

    // Handle potential Prisma errors or other exceptions
    if (error instanceof SyntaxError) {
      // Malformed JSON in request body
      return NextResponse.json(
        { error: "Invalid JSON format in request body" },
        { status: 400 },
      );
    }
    // Add more specific error handling if needed (e.g., PrismaClientKnownRequestError)

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
