import type { NextAuthConfig } from "next-auth";
import Kakao from "next-auth/providers/kakao";

export default {
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.properties?.nickname,
          email: profile.kakao_account?.email,
          image: profile.properties?.profile_image,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
