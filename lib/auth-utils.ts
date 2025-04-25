import prisma from "@/lib/prisma";
import { Session } from "next-auth";

// DB에서 사용자 유효성 검증 함수
export async function validateUserInDB(
  session: Session | null,
): Promise<boolean> {
  if (!session?.user?.id) {
    return false;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    return !!dbUser; // 사용자가 DB에 존재하면 true, 아니면 false 반환
  } catch (error) {
    console.error("DB에서 사용자 검증 중 오류:", error);
    return false;
  }
}

// API 응답 처리 및 오류 처리 함수
export async function handleApiResponse<T>(
  apiCall: () => Promise<Response>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const errorData = await response.json();

      // 401 상태 코드와 redirectToLogin 플래그가 있으면 로그인 페이지로 리다이렉트
      if (response.status === 401 && errorData.redirectToLogin) {
        // 클라이언트 사이드에서는 router를 사용해 리다이렉트
        window.location.href = "/login";
        return {
          data: null,
          error: "세션이 만료되었습니다. 다시 로그인해주세요.",
        };
      }

      return {
        data: null,
        error: errorData.error || errorData.message || "요청 실패",
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error("API 요청 오류:", error);
    return { data: null, error: "API 요청 중 오류가 발생했습니다." };
  }
}
