"use client";

import Image from "next/image";

export default function LoginPage() {
  // 카카오 로그인 URL 생성
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}`;

  // 로그인 버튼 클릭 시 카카오 인증 페이지로 이동
  const handleKakaoLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      {/* 로고 */}
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-800 md:text-4xl">
        <p>사회적협동조합</p>
        <p className="mt-2">청소년자립학교</p>
      </h1>

      {/* 카카오 로그인 버튼 */}
      <button onClick={handleKakaoLogin} className="relative cursor-pointer">
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
