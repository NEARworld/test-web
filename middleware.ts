import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

// 커스텀 토큰 타입 정의
interface CustomToken {
  sub?: string;
  position?: "UNKNOWN" | "ADMIN" | "USER" | string; // 가능한 모든 직급 추가
}

// 경로 상수 정의
const PATHS = {
  LOGIN: "/login",
  HOME: "/",
  DASHBOARD: "/dashboard",
  ACCESS_DENIED: "/access-denied",
};

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();
  const token = (await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  })) as CustomToken;

  if (
    req.url.endsWith("admin") &&
    (token?.position !== "CEO" || session?.user.role !== "ADMIN")
  ) {
    return NextResponse.redirect(new URL(PATHS.ACCESS_DENIED, req.url));
  }

  const isAuthenticated = !!session && !!token?.sub;
  const userPosition = token?.position;
  const currentPath = req.nextUrl.pathname;

  // 인증되지 않은 사용자 처리
  if (!isAuthenticated) {
    return handleUnauthenticatedUser(req, currentPath);
  }

  // 인증된 사용자 처리
  if (session?.user.name) {
    return handleAuthenticatedUser(req, currentPath, userPosition);
  }

  // 이 위치에 도달하면 예기치 않은 상황임
  return NextResponse.redirect(new URL(PATHS.LOGIN, req.url));
});

/**
 * 인증되지 않은 사용자의 라우팅 처리
 */
function handleUnauthenticatedUser(req: NextRequest, currentPath: string) {
  const isLoginPage = currentPath === PATHS.LOGIN;

  if (!isLoginPage) {
    return NextResponse.redirect(new URL(PATHS.LOGIN, req.url));
  }

  return NextResponse.next();
}

/**
 * 인증된 사용자의 직급에 따른 라우팅 처리
 */
function handleAuthenticatedUser(
  req: NextRequest,
  currentPath: string,
  userPosition?: string,
) {
  // 사용자가 로그인/홈 페이지에 있는지 확인
  const isLoginOrHome =
    currentPath === PATHS.LOGIN || currentPath === PATHS.HOME;
  const isAccessDenied = currentPath === PATHS.ACCESS_DENIED;

  // 직급이 UNKNOWN인 사용자 처리
  if (userPosition === "UNKNOWN") {
    if (!isAccessDenied) {
      return NextResponse.redirect(new URL(PATHS.ACCESS_DENIED, req.url));
    }
    return NextResponse.next();
  }

  // 유효한 직급을 가진 사용자 처리
  if (userPosition !== "UNKNOWN") {
    if (isAccessDenied) {
      return NextResponse.redirect(new URL(PATHS.DASHBOARD, req.url));
    }

    if (isLoginOrHome) {
      return NextResponse.redirect(new URL(PATHS.DASHBOARD, req.url));
    }
  }

  return NextResponse.next();
}

// public 자산 및 API를 제외한 모든 경로에 미들웨어 적용
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
