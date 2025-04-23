import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params;

    // 사용자 인증 정보 획득
    const session = await auth();
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
    });

    // 인증된 사용자가 없는 경우 오류 반환
    if (!session?.user || !token?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const currentUserId = token.id as string;

    // 기존 태스크 조회
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: "업무를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // 권한 검사: 작성자만 수정 가능 (추후 관리자 권한 추가 가능)
    if (existingTask.createdById !== currentUserId) {
      return NextResponse.json(
        { success: false, error: "이 업무를 수정할 권한이 없습니다" },
        { status: 403 },
      );
    }

    // FormData 파싱 및 데이터 추출
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const assignee = formData.get("assignee") as string | null;
    const dueDate = formData.get("dueDate") as string | null;
    const description = formData.get("description") as string | null;
    const taskFile = formData.get("taskFile") as File | null;

    // 필수 필드 유효성 검사
    if (!title || !assignee || !dueDate) {
      return NextResponse.json(
        { success: false, error: "필수 입력 항목이 누락되었습니다" },
        { status: 400 },
      );
    }

    // 수정 내역 저장 (TaskModificationHistory)
    await prisma.taskModificationHistory.create({
      data: {
        task: {
          connect: { id: existingTask.id },
        },
        modifiedBy: {
          connect: { id: currentUserId },
        },
        previousTitle: existingTask.title,
        previousDescription: existingTask.description || null,
        previousStatus: existingTask.status,
        previousDueDate: existingTask.dueDate || null,
        previousAssigneeId: existingTask.assigneeId || null,
        previousFileUrl: existingTask.fileUrl || null,
        previousFileName: existingTask.fileName || null,
        previousFileType: existingTask.fileType || null,
      },
    });

    let fileUrl = existingTask.fileUrl;
    let fileName = existingTask.fileName;
    let fileType = existingTask.fileType;

    // 새 파일이 업로드된 경우 처리
    if (taskFile) {
      // 파일 이름 및 경로 설정
      const fileExtension = taskFile.name.split(".").pop();
      const newFileName = `tasks/${uuidv4()}.${fileExtension}`;

      // Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files")
        .upload(newFileName, taskFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("파일 업로드 오류:", uploadError);
        throw new Error(`파일 업로드 실패: ${uploadError.message}`);
      }

      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files")
        .getPublicUrl(newFileName);

      if (!urlData || !urlData.publicUrl) {
        // 직접 URL 구성 시도
        fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${
          process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files"
        }/${newFileName}`;
      } else {
        fileUrl = urlData.publicUrl;
      }

      fileName = taskFile.name;
      fileType = taskFile.type;

      // 기존 파일이 있다면 삭제 (선택적)
      if (existingTask.fileUrl && existingTask.fileName) {
        try {
          // 경로에서 파일 이름 추출
          const oldFilePathMatch = existingTask.fileUrl.match(/tasks\/[^/]+$/);
          if (oldFilePathMatch && oldFilePathMatch[0]) {
            await supabase.storage
              .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files")
              .remove([oldFilePathMatch[0]]);
          }
        } catch (deleteError) {
          console.error("기존 파일 삭제 오류:", deleteError);
          // 파일 삭제 실패는 업무 업데이트에 영향을 주지 않음
        }
      }
    }

    // 업무 정보 업데이트
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description: description || null,
        assigneeId: assignee,
        dueDate: new Date(dueDate),
        fileUrl,
        fileName,
        fileType,
      },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    const taskWithCreator = {
      ...updatedTask,
      creator: updatedTask.createdBy,
    };

    return NextResponse.json({
      success: true,
      task: taskWithCreator,
      message: "업무가 성공적으로 수정되었습니다",
    });
  } catch (error) {
    console.error("업무 수정 오류:", error);
    return NextResponse.json(
      { success: false, error: "업무 수정 중 서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// 업무 삭제 API (추가 기능)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params;

    // 사용자 인증 정보 획득
    const session = await auth();
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
    });

    if (!session?.user || !token?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const currentUserId = token.id as string;

    // 기존 태스크 조회
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: "업무를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // 권한 검사: 작성자만 삭제 가능 (추후 관리자 권한 추가 가능)
    if (existingTask.createdById !== currentUserId) {
      return NextResponse.json(
        { success: false, error: "이 업무를 삭제할 권한이 없습니다" },
        { status: 403 },
      );
    }

    // 연결된 파일 삭제
    if (existingTask.fileUrl) {
      try {
        const filePathMatch = existingTask.fileUrl.match(/tasks\/[^/]+$/);
        if (filePathMatch && filePathMatch[0]) {
          await supabase.storage
            .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files")
            .remove([filePathMatch[0]]);
        }
      } catch (deleteError) {
        console.error("파일 삭제 오류:", deleteError);
        // 파일 삭제 실패는 업무 삭제에 영향을 주지 않음
      }
    }

    // 업무 삭제 (관련 수정 내역은 cascade로 함께 삭제됨)
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      success: true,
      message: "업무가 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("업무 삭제 오류:", error);
    return NextResponse.json(
      { success: false, error: "업무 삭제 중 서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
