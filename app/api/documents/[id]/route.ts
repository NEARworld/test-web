import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { BoardType } from "@prisma/client";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { uploadFileToSupabaseStorage } from "@/lib/document-utils";

const SUPABASE_BUCKET_NAME = "documents";

// GET 요청: 특정 Document 조회
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;

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
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;

  if (!id) {
    return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
  }

  // 인증 확인
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    // 현재 문서 조회 (권한 확인용)
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    // 수정 권한은 작성자, 일반 비서, 사장, 헤드 모두 가능
    // const { isAuthor, isGeneralSecretary, isCEO, isHead } = getUserPermissions(
    //   session,
    //   document.createdById,
    // );

    // if (!isAuthor && !isGeneralSecretary && !isCEO && !isHead) {
    //   return NextResponse.json(
    //     { error: "수정 권한이 없습니다." },
    //     { status: 403 },
    //   );
    // }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const boardType = formData.get("boardType") as string;
    const newFiles = formData.getAll("newFiles") as File[];
    const deleteAttachmentIdsString = formData.get("deleteAttachmentIds") as
      | string
      | null;
    const deleteAttachmentIds: string[] = deleteAttachmentIdsString
      ? JSON.parse(deleteAttachmentIdsString)
      : [];

    if (!title || !boardType) {
      return NextResponse.json(
        { error: "제목과 게시판 유형은 필수입니다." },
        { status: 400 },
      );
    }
    if (!Object.values(BoardType).includes(boardType as BoardType)) {
      return NextResponse.json(
        { error: "유효하지 않은 게시판 유형입니다." },
        { status: 400 },
      );
    }

    const updatedDocument = await prisma.$transaction(async (tx) => {
      // 1. 기존 첨부파일 삭제 (Supabase Storage 및 DB)
      if (deleteAttachmentIds.length > 0) {
        for (const attachmentIdToDelete of deleteAttachmentIds) {
          const attachmentToDelete = await tx.attachment.findUnique({
            where: { id: attachmentIdToDelete },
          });

          if (attachmentToDelete && attachmentToDelete.fileUrl) {
            try {
              // fileUrl에서 Supabase 스토리지 경로 추출 (중요: URL 구조에 따라 변경 필요)
              // 예: https://<project_ref>.supabase.co/storage/v1/object/public/BUCKET_NAME/path/to/file.ext
              // 위에서 BUCKET_NAME 이후의 경로를 추출해야 함
              const urlParts = attachmentToDelete.fileUrl.split(
                "/" + SUPABASE_BUCKET_NAME + "/",
              );
              if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                const { error: deleteError } = await supabase.storage
                  .from(SUPABASE_BUCKET_NAME)
                  .remove([storagePath]);
                if (deleteError) {
                  console.error(
                    `Supabase file deletion failed for path ${storagePath}:`,
                    deleteError,
                  );
                  // 필요시 여기서 throw error 하여 트랜잭션 롤백
                }
              } else {
                console.warn(
                  `Could not determine Supabase storage path from URL: ${attachmentToDelete.fileUrl}`,
                );
              }
            } catch (fileError) {
              console.error(
                `Error processing file deletion for URL ${attachmentToDelete.fileUrl}:`,
                fileError,
              );
            }
          }
          if (attachmentToDelete) {
            await tx.attachment.delete({
              where: { id: attachmentIdToDelete },
            });
          }
        }
      }

      // 2. 새로운 첨부파일 생성 및 저장 (Supabase Storage 및 DB)
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const { originalFileName, fileType, fileUrl } =
            await uploadFileToSupabaseStorage(file);

          await tx.attachment.create({
            data: {
              documentId: id,
              fileName: originalFileName,
              fileType,
              fileUrl, // Supabase 공개 URL 저장
              // storageKey: uniqueFileName, // 삭제를 위해 이 키를 저장하는 것이 더 안정적입니다.
            },
          });
        }
      }

      // 3. 문서 기본 정보 업데이트
      const doc = await tx.document.update({
        where: { id },
        data: { title, description, boardType: boardType as BoardType },
      });
      return doc;
    });

    const result = await prisma.document.findUnique({
      where: { id: updatedDocument.id },
      include: { attachments: true, createdBy: true },
    });

    return NextResponse.json(result);
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
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = (await params).id;
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
