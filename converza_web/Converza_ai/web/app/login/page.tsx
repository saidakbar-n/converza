"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Loader2, ShieldCheck } from "lucide-react";
import TelegramLoginWidget from "@/components/auth/TelegramLoginWidget";
import { setStoredAuth } from "@/lib/auth";
import { fetchAuthConfig, type TelegramAuthResponse } from "@/lib/converza-api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [salesBot, setSalesBot] = useState("ConverzaSales_bot");
  const [appBot, setAppBot] = useState("ConverzaApp_bot");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthConfig()
      .then((config) => {
        setSalesBot(config.sales_bot_username || "ConverzaSales_bot");
        setAppBot(config.bot_username || "ConverzaApp_bot");
      })
      .catch(() => {});
  }, []);

  const onSuccess = useCallback(
    (result: TelegramAuthResponse) => {
      setStoredAuth({
        token: result.token,
        orgId: result.org_id,
        user: { first_name: result.first_name, username: result.username },
      });
      setError(null);
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    },
    [nextPath, router],
  );

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-primary text-sm font-bold text-bg-elevated">
          C
        </span>
        <div>
          <h1 className="text-[18px] font-medium tracking-[-0.02em] text-text-primary">
            Sign in to Converza
          </h1>
          <p className="text-[13px] text-text-muted">Approved accounts only</p>
        </div>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border border-border bg-bg-secondary/80 p-4 text-[12.5px] leading-relaxed text-text-secondary">
        <p className="flex items-start gap-2">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Use Telegram (<strong>@{appBot}</strong>) to unlock the Co-Pilot dashboard,
            brand passport, and workspace APIs.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Bot size={15} className="mt-0.5 shrink-0 text-text-muted" />
          <span>
            Connect <strong>@{salesBot}</strong> as a Business Chatbot in Telegram Settings
            so Sleyz can handle inbound DMs using your brand passport.
          </span>
        </p>
      </div>

      <TelegramLoginWidget onSuccess={onSuccess} onError={setError} />

      {error && (
        <p className="mt-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-[12.5px] text-text-muted">
        No access yet?{" "}
        <Link href="/landing#pilot" className="font-medium text-accent hover:underline">
          Request pilot access
        </Link>{" "}
        or sign in from{" "}
        <a href="/" className="font-medium text-text-primary hover:underline">
          getconverza.com
        </a>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <Loader2 size={22} className="animate-spin text-accent" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
