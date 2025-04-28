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
          const response = await fetch("/api/auth/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: session.user.id }),
          });

          const data = await response.json();

          if (!data.valid) {
            // DB에 사용자가 없으면 로그아웃
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
