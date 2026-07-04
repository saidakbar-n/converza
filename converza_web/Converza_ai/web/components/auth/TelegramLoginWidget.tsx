"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ApiError,
  fetchAuthConfig,
  postTelegramAuth,
  type TelegramAuthResponse,
} from "@/lib/converza-api";

export interface TelegramAuthUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  onSuccess: (result: TelegramAuthResponse) => void;
  onError?: (message: string) => void;
  className?: string;
}

declare global {
  interface Window {
    [key: string]: ((user: TelegramAuthUser) => void) | undefined;
  }
}

function parseApiError(detail: string, fallback: string): string {
  try {
    const parsed = JSON.parse(detail) as { detail?: string };
    if (typeof parsed.detail === "string") return parsed.detail;
  } catch {
    // plain text detail
  }
  return detail || fallback;
}

export default function TelegramLoginWidget({
  onSuccess,
  onError,
  className,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackId = useId().replace(/:/g, "");
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = "";

    const callbackName = `onTelegramAuth_${callbackId}`;

    window[callbackName] = async (user: TelegramAuthUser) => {
      setLoading(true);
      setHint("Signing in…");
      try {
        const result = await postTelegramAuth(user as unknown as Record<string, unknown>);
        onSuccess(result);
      } catch (e) {
        const message =
          e instanceof ApiError
            ? parseApiError(e.message, "Telegram sign-in failed")
            : "Telegram sign-in failed";
        setHint(message);
        onError?.(message);
      } finally {
        setLoading(false);
      }
    };

    (async () => {
      try {
        const config = await fetchAuthConfig();
        if (cancelled || !container) return;

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute("data-telegram-login", config.bot_username || "ConverzaApp_bot");
        script.setAttribute("data-size", "large");
        script.setAttribute("data-radius", "8");
        script.setAttribute("data-onauth", `${callbackName}(user)`);
        script.setAttribute("data-request-access", "write");
        container.appendChild(script);
      } catch {
        if (!cancelled) {
          const message = "Could not load Telegram sign-in. Try again later.";
          setHint(message);
          onError?.(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      delete window[callbackName];
      container.innerHTML = "";
    };
  }, [callbackId, onError, onSuccess]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className={`flex min-h-[44px] items-center justify-center ${loading ? "opacity-60" : ""}`}
      />
      {hint && (
        <p className="mt-2 text-center text-[13px] font-medium text-stone-500">{hint}</p>
      )}
    </div>
  );
}
