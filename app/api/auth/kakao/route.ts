import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  console.log(code);
  console.log(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);

  try {
    const tokenResponse = await fetch(`https://kauth.kakao.com/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: `grant_type=authorization_code&client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI!}&code=${code}&client_secret=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET!}`,
    });
    const res = await tokenResponse.json();

    const { access_token } = res;

    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();

    const { id: kakaoId, properties, kakao_account } = userData;
    const email = kakao_account?.email;
    const nickname = properties?.nickname;

    const user = await prisma.user.upsert({
      where: { kakaoId: kakaoId.toString() },
      update: {
        email,
        nickname,
        accessToken: access_token,
        updatedAt: new Date(),
      },
      create: {
        kakaoId: kakaoId.toString(),
        email,
        nickname,
        accessToken: access_token,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        kakaoId: user.kakaoId,
        email: user.email,
        nickname: user.nickname,
      },
      token: access_token,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "로그인 실패" },
      { status: 500 },
    );
  }
}
