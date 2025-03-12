import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();
  // Your custom middleware logic goes here
  if (session?.user.name)
    return NextResponse.redirect(new URL("/dashboard", req.url));

  // 미들웨어에서 요청을 수정하지 않고 그대로 다음 단계로 진행하도록 지시
  return NextResponse.next();
});

// middleware.ts의 matcher 설정은 Next.js 미들웨어가 어떤 경로에서 실행될지를 지정하는 설정
export const config = {
  matcher: ["/", "/login"],
};
