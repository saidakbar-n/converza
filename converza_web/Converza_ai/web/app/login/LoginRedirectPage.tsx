"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Legacy route — auth lives on the landing page modal. */
export default function LoginRedirectPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next");
    const url = new URL("/", window.location.origin);
    url.searchParams.set("login", "1");
    if (next) url.searchParams.set("next", next);
    window.location.replace(url.pathname + url.search);
  }, [searchParams]);

  return null;
}
