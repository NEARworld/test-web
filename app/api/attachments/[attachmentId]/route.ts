import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth"; // Updated import for auth

const prisma = new PrismaClient();

export async function DELETE(
  _: NextRequest,
  {
    params,
  }: {
    params: Promise<{ attachmentId: string }>;
  },
) {
  const session = await auth(); // Use auth() to get session

  if (!session || !session.user?.id) {
    return NextResponse.json(
      { error: "인증되지 않았습니다." },
      { status: 401 },
    );
  }

  const { attachmentId } = await params;

  if (!attachmentId) {
    return NextResponse.json(
      { error: "첨부파일 ID가 필요합니다." },
      { status: 400 },
    );
  }

  try {
    // 첨부파일 조회
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { document: true }, // 문서 정보를 포함하여 작성자 확인
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "첨부파일을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 권한 확인: 해당 첨부파일이 속한 문서의 작성자인지 확인
    // 또는 사용자가 관리자(ADMIN) 권한을 가지고 있는지 확인
    if (
      attachment.document.createdById !== session.user.id &&
      session.user.role !== "ADMIN" // UserRole.ADMIN 대신 "ADMIN" 문자열 사용 가정
    ) {
      return NextResponse.json(
        { error: "이 첨부파일을 삭제할 권한이 없습니다." },
        { status: 403 },
      );
    }

    // TODO: S3 등 외부 저장소에서 실제 파일 삭제 로직 추가 필요
    // 예: await deleteFileFromS3(attachment.fileUrl);

    // 데이터베이스에서 첨부파일 삭제
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json(
      { message: "첨부파일이 성공적으로 삭제되었습니다." },
      { status: 200 },
    );
  } catch (error) {
    console.error("첨부파일 삭제 오류:", error);
    return NextResponse.json(
      { error: "첨부파일 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
