"use client";

import { AuthCheckProvider } from "@/app/AuthCheckProvider";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthCheckProvider>{children}</AuthCheckProvider>
    </SessionProvider>
  );
}
