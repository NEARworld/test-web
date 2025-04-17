import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } },
) {
  try {
    const taskId = params.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    // 1. 데이터베이스에서 해당 작업 정보 조회
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. 파일 정보가 없는 경우 에러 응답
    if (!task.fileUrl || !task.fileName) {
      return NextResponse.json(
        { error: "No file attached to this task" },
        { status: 404 },
      );
    }

    // 3. 파일 URL에서 파일 경로 추출 (Supabase 스토리지 경로)
    // fileUrl 형식: https://[supabase-url]/storage/v1/object/public/[bucket]/[path]
    const url = new URL(task.fileUrl);
    const pathSegments = url.pathname.split("/");
    const bucketIndex = pathSegments.findIndex(
      (segment) => segment === "public" || segment === "object",
    );

    if (bucketIndex === -1 || bucketIndex + 2 >= pathSegments.length) {
      return NextResponse.json(
        { error: "Invalid file URL format" },
        { status: 500 },
      );
    }

    const bucket = pathSegments[bucketIndex + 1];
    const filePath = pathSegments.slice(bucketIndex + 2).join("/");

    // 4. Supabase 스토리지에서 파일 다운로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      console.error("Error downloading file from Supabase:", error);
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 },
      );
    }

    // 5. 파일 타입 결정 (DB에 저장된 타입 사용 또는 파일 확장자로 추론)
    const contentType = task.fileType || inferContentType(task.fileName);

    // 6. 브라우저로 파일 스트림 반환
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `inline; filename="${task.fileName}"`);

    return new NextResponse(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error in file download API:", error);
    return NextResponse.json(
      { error: "Server error while processing file download" },
      { status: 500 },
    );
  }
}

// 파일 확장자를 기반으로 MIME 타입 추론
function inferContentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const mimeTypes: Record<string, string> = {
    // 이미지
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // 문서
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // 텍스트
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    css: "text/css",
    js: "text/javascript",
    json: "application/json",
    md: "text/markdown",
    // 압축
    zip: "application/zip",
    rar: "application/vnd.rar",
    tar: "application/x-tar",
    "7z": "application/x-7z-compressed",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
