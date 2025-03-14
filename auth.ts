// app/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import authConfig from "./auth.config";

// NextAuth 설정 타입 정의
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Prisma 어댑터 설정
  adapter: PrismaAdapter(prisma as PrismaClient),

  // Kakao 소셜 로그인 제공자 설정
  ...authConfig,

  // 세션 설정
  session: {
    strategy: "jwt", // "jwt" 또는 "database"
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  // 페이지 경로 커스터마이징
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  // 콜백 함수 (타입 정의 포함)
  callbacks: {
    // JWT 토큰 커스터마이징
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;

        if (account?.provider === "kakao") {
          // upsert를 사용하여 생성/업데이트 로직 통합
          await prisma.user.upsert({
            where: { id: user.id },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
            update: {
              name: user.name,
              email: user.email,
              image: user.image,
            },
          });
        }
      }
      return token;
    },

    // 세션 커스터마이징
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.sub as string; // 유저를 디비에서 조회할때 사용
        session.user.name = token.name as string; // 세션에 ID 추가
        session.user.email = token.email as string;
        session.user.image = token.image as string; // 프로필 이미지 추가
      }
      return session;
    },

    // // 리디렉션 설정
    // async redirect({ url, baseUrl }) {
    //   if (url.startsWith("/")) return `${baseUrl}${url}`;
    //   return baseUrl;
    // },
  },

  // 디버그 모드
  debug: process.env.NODE_ENV === "development",
});

// Next.js App Router에서 GET/POST 핸들러 내보내기
export { handlers as GET, handlers as POST };

// 세션 타입 확장 (선택 사항)
declare module "next-auth" {
  interface Session {
    user: {
      id: string; // 기본 타입에 id 추가
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface JWT {
    id?: string; // JWT 토큰에 id 추가
  }
}
