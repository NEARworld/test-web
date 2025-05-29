"use client";

import { ReactNode } from "react";
import { useAuthCheck } from "../hooks/useAuthCheck";

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
