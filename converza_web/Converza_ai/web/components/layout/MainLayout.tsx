"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import TheaterOfWorkLayout from "@/components/layout/TheaterOfWorkLayout";

interface MainLayoutProps {
  children: React.ReactNode;
}

/** Routes outside the authenticated Theater shell. */
function isStandaloneRoute(pathname: string | null) {
  if (!pathname) return false;
  if (pathname.startsWith("/landing") || pathname.startsWith("/login")) return true;
  // Marketing landing served at site root (FastAPI FileResponse on /)
  if (typeof window !== "undefined" && window.location.pathname === "/") return true;
  return false;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  if (isStandaloneRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <TheaterOfWorkLayout>{children}</TheaterOfWorkLayout>
    </AuthGuard>
  );
}
