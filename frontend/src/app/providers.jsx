"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-center" theme="dark" />
    </AuthProvider>
  );
}
