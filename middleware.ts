import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token", // 개발 환경에서 기본 사용되는 쿠키 이름
  });

  console.log("token:", token);
  console.log("NODE_ENV:", process.env.NODE_ENV);

  const isAuthenticated = !!session && !!token?.sub;
  const userPosition = token?.position;

  // 세션이 없는 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    const isLoginPage = req.nextUrl.pathname === "/login";
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 로그인된 사용자 처리
  if (session?.user.name) {
    const isLoginOrHome =
      req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/";
    const isAccessDenied = req.nextUrl.pathname === "/access-denied";

    // 직급이 UNKNOWN인 경우 access-denied 페이지로 리다이렉트 (이미 access-denied 페이지가 아닌 경우에만)
    if (userPosition === "UNKNOWN" && !isAccessDenied) {
      return NextResponse.redirect(new URL("/access-denied", req.url));
    }

    // 직급이 UNKNOWN이 아닌 경우, access-denied 페이지에 접근하면 dashboard로 리다이렉트
    if (userPosition !== "UNKNOWN" && isAccessDenied) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 로그인된 모든 사용자가 로그인 페이지나 홈페이지에 접근하면 대시보드로 리다이렉트
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
