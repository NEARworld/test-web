import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();

  // 세션이 없거나 만료된 경우 로그인 페이지로 리다이렉트
  if (!session) {
    // 현재 로그인 페이지가 아닌 경우에만 리다이렉트
    const isLoginPage = req.nextUrl.pathname === "/login";
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 로그인된 사용자가 로그인 페이지나 홈페이지에 접근하면 대시보드로 리다이렉트
  if (session?.user.name) {
    const isLoginOrHome = req.nextUrl.pathname === "/login";
    if (isLoginOrHome) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 그 외의 경우 다음 단계로 진행
  return NextResponse.next();
});

// 모든 경로에 미들웨어 적용 (public 파일과 API 경로 제외)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
