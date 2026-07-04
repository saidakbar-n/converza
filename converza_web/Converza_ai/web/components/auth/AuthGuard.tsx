"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { validateSession } from "@/lib/converza-api";

interface AuthGuardProps {
  children: React.ReactNode;
}

/** Blocks Theater routes until Telegram JWT is valid. */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
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

      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

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
