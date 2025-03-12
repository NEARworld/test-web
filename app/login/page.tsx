"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      {/* 로고 */}
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 md:text-4xl">
        <p>사회적협동조합</p>
        <p className="mt-2">청소년자립학교</p>
      </h1>

      {/* 카카오 로그인 버튼 */}
      <button
        onClick={() => signIn("kakao", { redirectTo: "/dashboard" })}
        className="relative cursor-pointer"
      >
        <Image
          src="https://developers.kakao.com/assets/img/about/logos/kakaologin/kr/kakao_account_login_btn_medium_narrow.png"
          alt="카카오 로그인 버튼"
          width={200}
          height={45}
          className="transition-opacity hover:opacity-80"
        />
      </button>
    </div>
  );
}
