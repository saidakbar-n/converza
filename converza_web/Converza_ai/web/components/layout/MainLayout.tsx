"use client";

import { usePathname } from "next/navigation";
import TheaterOfWorkLayout from "@/components/layout/TheaterOfWorkLayout";

interface MainLayoutProps {
  children: React.ReactNode;
}

/** Routes that render outside the Theater shell (marketing only). */
function isStandaloneRoute(pathname: string | null) {
  return pathname?.startsWith("/landing") ?? false;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  if (isStandaloneRoute(pathname)) {
    return <>{children}</>;
  }

  return <TheaterOfWorkLayout>{children}</TheaterOfWorkLayout>;
}
