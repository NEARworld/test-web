import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // 카카오 사용자 인증 정보 획득
    const session = await auth();
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token", // 개발 환경에서 기본 사용되는 쿠키 이름
    });

    // 인증된 사용자가 없는 경우 오류 반환
    if (!session?.user || !token?.id) {
      return NextResponse.json(
        { success: false, error: "카카오 로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const currentUser = {
      id: token.id as string,
    };

    // 1. FormData 파싱
    const formData = await req.formData();
    // 2. 텍스트 데이터 추출
    const title = formData.get("title") as string | null;
    const assignee = formData.get("assignee") as string | null; // 담당자 ID
    const dueDate = formData.get("dueDate") as string | null;
    const description = formData.get("description") as string | null; // 설명 (선택적)

    // 3. 파일 데이터 추출
    const taskFile = formData.get("taskFile") as File | null;

    // 필수 필드 유효성 검사
    if (!title || !assignee || !dueDate) {
      return NextResponse.json(
        { success: false, error: "Missing required text fields" },
        { status: 400 },
      );
    }

    let fileUrl: string | null = null;
    let uploadedFileName: string | null = null;
    let uploadedFileType: string | null = null;

    // 4. 파일 처리 (파일이 첨부된 경우)
    if (taskFile) {
      // 파일 이름 중복 방지 및 경로 설정
      const fileExtension = taskFile.name.split(".").pop();
      // 예시: tasks/{uuid}.{extension} 형식으로 경로 및 파일 이름 생성
      const fileName = `tasks/${uuidv4()}.${fileExtension}`;
      uploadedFileName = taskFile.name; // 원본 파일 이름 저장
      uploadedFileType = taskFile.type; // 파일 타입 저장

      console.log(`Uploading file to Supabase Storage: ${fileName}`);

      // Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files") // 버킷 이름 (.env 또는 기본값)
        .upload(fileName, taskFile, {
          cacheControl: "3600", // 캐시 설정 (선택 사항)
          upsert: false, // 동일 이름 파일 덮어쓰기 방지 (선택 사항)
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // 5. 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files")
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        console.error("Failed to get public URL for:", fileName);
        // 파일은 업로드되었지만 URL 가져오기 실패 시 처리 (예: 기본 URL 구성 시도 또는 에러)
        // throw new Error("Failed to get public URL after upload.");
        // 임시 방편: 직접 URL 구성 (버킷이 public일 경우)
        fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET_NAME || "task-files"}/${fileName}`;
        console.warn("Using manually constructed URL:", fileUrl);
      } else {
        fileUrl = urlData.publicUrl;
        console.log(`File uploaded successfully. URL: ${fileUrl}`);
      }
    } // End of file processing

    // 6. 데이터베이스에 Task 정보 저장 (파일 정보 포함)
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || undefined, // null 대신 undefined 저장
        assignee: {
          connect: { id: assignee },
        },
        createdBy: {
          connect: { id: currentUser.id },
        },
        dueDate: new Date(dueDate),
        status: "INCOMPLETE",
        // 파일 정보 필드 추가
        fileUrl: fileUrl,
        fileName: uploadedFileName,
        fileType: uploadedFileType,
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
      ...newTask,
      creator: newTask.createdBy,
    };

    // 7. 성공 응답 반환
    return NextResponse.json({ success: true, task: taskWithCreator });
  } catch (err) {
    console.error("Task creation error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid input or DB error" },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit: string | null | number = searchParams.get("limit");
    const page: string | null | number = searchParams.get("page");

    const verifiedPage = page ? parseInt(page, 10) : 1;
    const verifiedLimit = limit ? parseInt(limit, 10) : 10; // 기본값을 1에서 10으로 변경

    const skip = (verifiedPage - 1) * verifiedLimit;

    const totalTasks = await prisma.task.count();

    const tasks = await prisma.task.findMany({
      skip,
      take: verifiedLimit,
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

    return NextResponse.json({ tasks: tasksWithCreator, totalTasks });
  } catch (error) {
    console.error("태스크 조회 중 오류 발생:", error);
    return NextResponse.json(
      { success: false, error: "태스크 조회 중 서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
