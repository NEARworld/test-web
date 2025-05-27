import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { BoardType } from "@prisma/client";
import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// GET 요청: 특정 Document 조회
export async function GET({ params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(document);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: "문서 조회 중 오류가 발생했습니다.", details: errorMessage },
      { status: 500 },
    );
  }
}

// PATCH 요청: Document 수정 (FormData 처리)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  // 인증 확인
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 현재 문서 조회
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 작성자 확인
    if (document.createdById !== userId) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다." },
        { status: 403 },
      );
    }

    // FormData 처리
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const boardType = formData.get("boardType") as string;
    const file = formData.get("file") as File | null;

    // 필수 필드 확인
    if (!title || !boardType) {
      return NextResponse.json(
        { error: "제목과 게시판 유형은 필수입니다." },
        { status: 400 },
      );
    }

    // boardType 유효성 검사
    if (!Object.values(BoardType).includes(boardType as BoardType)) {
      return NextResponse.json(
        { error: "유효하지 않은 게시판 유형입니다." },
        { status: 400 },
      );
    }

    // 업데이트 데이터 준비
    const updateData: {
      title: string;
      description: string;
      boardType: BoardType;
      fileName?: string;
      fileType?: string;
      fileUrl?: string;
    } = {
      title,
      description,
      boardType: boardType as BoardType,
    };

    // 파일 처리
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 파일 확장자 추출
      const originalName = file.name;
      const fileExt = originalName.split(".").pop() || "";

      // 파일 저장 경로 및 이름 설정
      const fileName = `${uuidv4()}.${fileExt}`;
      const publicDir = join(process.cwd(), "public");
      const uploadsDir = join(publicDir, "uploads");
      const filePath = join(uploadsDir, fileName);

      // 파일 저장
      await writeFile(filePath, buffer);

      // 파일 정보 업데이트 데이터에 추가
      updateData.fileName = originalName;
      updateData.fileType = file.type;
      updateData.fileUrl = `/uploads/${fileName}`;
    }

    // 문서 업데이트
    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("문서 수정 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: "문서 수정 중 오류가 발생했습니다.", details: errorMessage },
      { status: 500 },
    );
  }
}

// DELETE 요청: Document 삭제
export async function DELETE({ params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  // 인증 확인
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 현재 문서 조회
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 작성자 확인
    if (document.createdById !== userId) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다." },
        { status: 403 },
      );
    }

    // 문서 삭제 (또는 isDeleted 필드 업데이트)
    const deleted = await prisma.document.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json(deleted);
  } catch (error: unknown) {
    console.error("문서 삭제 오류:", error);
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: "문서 삭제 중 오류가 발생했습니다.", details: errorMessage },
      { status: 500 },
    );
  }
}
