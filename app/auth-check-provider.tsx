"use client";

import { ReactNode } from "react";
import { useAuthCheck } from "./hooks/use-auth-check";

interface AuthCheckProviderProps {
  children: ReactNode;
}

export function AuthCheckProvider({ children }: AuthCheckProviderProps) {
  const { isChecking } = useAuthCheck();

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
