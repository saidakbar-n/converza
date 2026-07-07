"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, Loader2 } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchAgentThread,
  sendAgentMessage,
  type SwitchboardAgentId,
} from "@/lib/converza-api";

type ThreadMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

const agentMeta: Record<
  SwitchboardAgentId,
  { title: string; subtitle: string; placeholder: string }
> = {
  milo: {
    title: "Milo",
    subtitle: "growth & strategy",
    placeholder: "Ask Milo for hooks, angles, calendars, or competitive positioning…",
  },
  sleyz: {
    title: "Sleyz",
    subtitle: "sales & closing",
    placeholder: "Ask Sleyz for a draft reply, objection handling, or lead prioritization…",
  },
  vea: {
    title: "Vea",
    subtitle: "video & assets",
    placeholder: "Ask Vea for scripts or say 'render this video' to queue a 15s asset…",
  },
};

export default function AgentChatPage({
  agentId,
}: {
  agentId: SwitchboardAgentId;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meta = agentMeta[agentId];

  const loadThread = useCallback(async () => {
    const data = await fetchAgentThread(agentId);
    setMessages(
      (data.messages || []).map((row) => ({
        id: String(row.id),
        role: row.role,
        content: row.content,
      })),
    );
  }, [agentId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadThread();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load thread");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadThread]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMessage: ThreadMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const result = await sendAgentMessage(agentId, text);
      const response =
        result.response ||
        (result.hitl_draft_id
          ? "Queued for approval — check Squad Chat for the render preview."
          : "Queued. I will follow up in Squad Chat if approval is needed.");
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: response,
        },
      ]);
    } catch (e) {
      const detail = e instanceof ApiError ? e.message : "Agent request failed";
      setError(detail);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "agent", content: `I could not complete that request.\n\n${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <WorkspaceShell
      title={meta.title}
      subtitle={meta.subtitle}
      badge={
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-primary"
        >
          <ArrowLeft size={14} />
          All agents
        </Link>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-8 md:px-10">
          <p className="max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            Direct thread with {meta.title}. Cross-agent handoffs and approvals still land in Squad
            Chat.
          </p>
          {error && (
            <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
              {error}
            </p>
          )}
          {booting && <p className="text-[13px] text-text-muted">Loading thread…</p>}

          {!booting && messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated p-5 text-[13px] text-text-muted">
              Start with a concrete request. Mention another agent inside the prompt if you want a
              handoff.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-text-primary text-bg-elevated"
                      : "bg-bg-elevated text-text-primary"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-bg-primary px-6 py-4 md:px-10">
          <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-border bg-bg-elevated p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={3}
              placeholder={meta.placeholder}
              className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-text-primary text-bg-elevated disabled:opacity-60"
              aria-label="Send"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
