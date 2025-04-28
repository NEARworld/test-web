"use client";

import { SessionProvider } from "next-auth/react";
import { AuthCheckProvider } from "./auth-check-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthCheckProvider>{children}</AuthCheckProvider>
    </SessionProvider>
  );
}
