"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {/* 로고 */}
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 md:text-4xl">
        <p>사회적협동조합 청소년 자립학교</p>
        <p className="text-base text-gray-500">직원 전용 웹서비스</p>
      </h1>

      <Image
        src="/youth.png"
        alt="logo"
        width={500}
        height={500}
        className="-mt-7"
      />

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
