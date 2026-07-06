"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { authHeaders, getStoredAuth } from "@/lib/auth";
import { apiUrl, fetchCopilotStatus, type CopilotStatus } from "@/lib/converza-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  setupBanner?: SetupBanner | null;
}

interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
}

interface SetupBanner {
  title: string;
  body: string;
  links: { href: string; label: string }[];
}

const AGENT_MENTIONS = ["@Milo", "@Sleyz", "@Vea"] as const;

function parseApiDetail(errText: string): string {
  try {
    const parsed = JSON.parse(errText) as { detail?: string };
    if (typeof parsed.detail === "string") return parsed.detail;
  } catch {
    // plain text
  }
  return errText;
}

function setupBannerFromChatError(status: number, errText: string): SetupBanner | null {
  const detail = parseApiDetail(errText);
  const lower = detail.toLowerCase();

  if (status === 403) {
    if (
      lower.includes("passport") ||
      lower.includes("pasport") ||
      lower.includes("not ready") ||
      lower.includes("tayyor emas")
    ) {
      return {
        title: "Brand passport required",
        body: "Complete your brand passport so the Manager can route work to Milo, Sleyz, and Vea.",
        links: [
          { href: "/settings/brand", label: "Open brand passport" },
          { href: "/settings/integrations", label: "Connect integrations" },
        ],
      };
    }
    return {
      title: "Setup incomplete",
      body: "Finish onboarding before using the Master Feed.",
      links: [
        { href: "/settings/brand", label: "Brand passport" },
        { href: "/settings/integrations", label: "Integrations setup" },
      ],
    };
  }

  if (status === 503 || lower.includes("llm") || lower.includes("groq") || lower.includes("hermes")) {
    return {
      title: "AI runtime unavailable",
      body: "The backend LLM is not configured yet. Check integrations or try again later.",
      links: [{ href: "/settings/integrations", label: "View integrations" }],
    };
  }

  return null;
}

function setupBannerFromCopilotStatus(status: CopilotStatus): SetupBanner | null {
  if (status.ready) return null;
  const reason = (status.reason || "").toLowerCase();
  if (reason.includes("passport") || reason.includes("pasport") || reason.includes("incomplete")) {
    return {
      title: "Finish your brand passport",
      body: status.reason || "Save your business name and core offer to unlock the Manager feed.",
      links: [
        { href: "/settings/brand", label: "Complete brand passport" },
        { href: "/settings/integrations", label: "Connect Telegram" },
      ],
    };
  }
  return {
    title: "Co-Pilot not ready",
    body: status.reason || "Complete setup to start chatting with the Manager.",
    links: [
      { href: "/settings/brand", label: "Brand passport" },
      { href: "/settings/integrations", label: "Integrations setup" },
    ],
  };
}

async function streamChat(
  message: string,
  history: HistoryEntry[],
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string, status: number) => void,
) {
  const response = await fetch(apiUrl("/chat"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      message,
      user_role: "Owner",
      conversation_history: history,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    onError(errText.slice(0, 400) || `Request failed: ${response.status}`, response.status);
    return;
  }
  if (!response.body) {
    onError("No response body.", response.status);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      try {
        const payload = JSON.parse(raw);
        if (payload.error) {
          onError(payload.error, response.status);
          return;
        }
        if (payload.done) {
          onDone();
          return;
        }
        if (payload.token) onToken(payload.token);
      } catch {
        // skip malformed chunk
      }
    }
  }
  onDone();
}

export default function MasterFeed() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I'm your Manager — one feed for the whole team. Route work with @Milo, @Sleyz, or @Vea. What should we ship today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [copilotHint, setCopilotHint] = useState<SetupBanner | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function refreshAuthState() {
      const auth = getStoredAuth();
      setSignedIn(!!auth?.token);
      if (auth?.token) {
        setMessages((m) =>
          m.length === 1 && m[0]?.id === "welcome"
            ? [
                {
                  id: "welcome",
                  role: "assistant",
                  content:
                    "I'm your Manager — one feed for the whole team. Route work with @Milo, @Sleyz, or @Vea. What should we ship today?",
                },
              ]
            : m,
        );
      }
    }
    refreshAuthState();
    window.addEventListener("converza:auth-updated", refreshAuthState);
    return () => window.removeEventListener("converza:auth-updated", refreshAuthState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getStoredAuth()?.token) {
        if (!cancelled) setCopilotHint(null);
        return;
      }
      try {
        const status = await fetchCopilotStatus();
        if (!cancelled) setCopilotHint(setupBannerFromCopilotStatus(status));
      } catch {
        if (!cancelled) setCopilotHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const behavior = last?.streaming ? "auto" : "smooth";
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!getStoredAuth()?.token) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Please sign in via Telegram on /landing, then reopen the app.",
        },
      ]);
      return;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInput("");
    setLoading(true);

    const history: HistoryEntry[] = messages
      .filter((m) => !m.streaming && m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: text });

    let acc = "";
    await streamChat(
      text,
      history,
      (token) => {
        acc += token;
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: acc, streaming: true } : msg,
          ),
        );
      },
      () => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, streaming: false } : msg,
          ),
        );
        setLoading(false);
      },
      (err, status) => {
        const banner = setupBannerFromChatError(status, err);
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: banner ? "" : `Something went wrong. Please try again.`,
                  setupBanner: banner,
                  streaming: false,
                }
              : msg,
          ),
        );
        if (banner) setCopilotHint(banner);
        setLoading(false);
      },
    );
  }, [input, loading, messages]);

  function insertMention(tag: string) {
    setInput((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-bg-secondary">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border/60 px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent">
          <Sparkles size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-text-primary">
            Master Manager Feed
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
            {signedIn ? "Live · Converza backend" : "Sign in required"}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {copilotHint && (
          <div className="rounded-xl border border-warning/25 bg-warning-dim/40 px-3 py-3 text-[12.5px]">
            <p className="font-medium text-text-primary">{copilotHint.title}</p>
            <p className="mt-1 text-text-secondary">{copilotHint.body}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {copilotHint.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-hover"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "rounded-xl px-3 py-2.5 text-[13px] leading-[1.55]",
              msg.role === "user"
                ? "ml-6 bg-bg-elevated text-text-primary ring-1 ring-border"
                : "mr-2 bg-transparent text-text-secondary",
            )}
          >
            {msg.setupBanner ? (
              <div>
                <p className="font-medium text-text-primary">{msg.setupBanner.title}</p>
                <p className="mt-1">{msg.setupBanner.body}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.setupBanner.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-border bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-hover"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              msg.content
            )}
            {msg.streaming && (
              <Loader2 size={12} className="mt-1 inline animate-spin text-text-muted" />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border/60 p-3 pb-safe">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {AGENT_MENTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertMention(tag)}
              className="rounded-full border border-border bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-border bg-bg-elevated p-2 ring-1 ring-transparent focus-within:ring-accent/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message the Manager… @Milo @Sleyz @Vea"
            className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-snug text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-text-primary text-bg-elevated transition-opacity disabled:opacity-40"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ArrowUp size={15} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
