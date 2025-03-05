"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      const fetchToken = async () => {
        try {
          const response = await fetch("/api/auth/kakao", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          });
          const data = await response.json();
          console.log("토큰 응답:", data);
          router.push("/");
        } catch (error) {
          console.error("로그인 실패:", error);
          router.push("/login");
        }
      };
      fetchToken();
    }
  }, [code, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <p className="text-lg text-gray-600">로그인 처리 중...</p>
    </div>
  );
}
