"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { validateSession } from "@/lib/converza-api";

interface AuthGuardProps {
  children: React.ReactNode;
}

function landingSignInUrl(pathname: string | null): string {
  const next = encodeURIComponent(pathname || "/");
  return `/app/landing?login=1&next=${next}`;
}

/** Blocks Theater routes until Telegram JWT is valid. */
export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const session = await validateSession();
      if (cancelled) return;

      if (session) {
        setReady(true);
        return;
      }

      window.location.replace(landingSignInUrl(pathname));
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 size={22} className="animate-spin text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]">Checking session</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
