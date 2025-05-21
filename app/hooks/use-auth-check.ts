"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function useAuthCheck() {
  const { data: session } = useSession();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function validateSession() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/user");
          const userData = await response.json();

          // 사용자 정보가 없거나 에러가 있으면 로그아웃
          if (response.status !== 200 || userData.error) {
            console.log("사용자가 DB에 존재하지 않아 로그아웃됩니다.");
            signOut({ callbackUrl: "/login" });
          }
        } catch (error) {
          console.error("세션 검증 중 오류:", error);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsChecking(false);
      }
    }

    validateSession();
  }, [session]);

  return { isChecking };
}
