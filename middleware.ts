import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

// Define custom token type
interface CustomToken {
  sub?: string;
  position?: "UNKNOWN" | "ADMIN" | "USER" | string; // Add all possible positions
}

// Define path constants
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

  const isAuthenticated = !!session && !!token?.sub;
  const userPosition = token?.position;
  const currentPath = req.nextUrl.pathname;

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return handleUnauthenticatedUser(req, currentPath);
  }

  // Handle authenticated users
  if (session?.user.name) {
    return handleAuthenticatedUser(req, currentPath, userPosition);
  }

  // If we get here, something unexpected happened
  return NextResponse.redirect(new URL(PATHS.LOGIN, req.url));
});

/**
 * Handle routing for unauthenticated users
 */
function handleUnauthenticatedUser(req: NextRequest, currentPath: string) {
  const isLoginPage = currentPath === PATHS.LOGIN;

  if (!isLoginPage) {
    return NextResponse.redirect(new URL(PATHS.LOGIN, req.url));
  }

  return NextResponse.next();
}

/**
 * Handle routing for authenticated users based on their position
 */
function handleAuthenticatedUser(
  req: NextRequest,
  currentPath: string,
  userPosition?: string,
) {
  // Check if user is on login/home pages
  const isLoginOrHome =
    currentPath === PATHS.LOGIN || currentPath === PATHS.HOME;
  const isAccessDenied = currentPath === PATHS.ACCESS_DENIED;

  // Handle users with UNKNOWN position
  if (userPosition === "UNKNOWN") {
    if (!isAccessDenied) {
      return NextResponse.redirect(new URL(PATHS.ACCESS_DENIED, req.url));
    }
    return NextResponse.next();
  }

  // Handle users with valid positions
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

// Apply middleware to all routes except public assets and API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
