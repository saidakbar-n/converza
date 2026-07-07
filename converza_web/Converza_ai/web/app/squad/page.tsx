"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, Check, Loader2, Pencil, X } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchSquadActivity,
  fetchSquadMessages,
  resolveHitlDraft,
  sendSquadMessage,
  type SwitchboardMessage,
  type SwitchboardStep,
} from "@/lib/converza-api";

function formatTime(value?: string) {
  if (!value) return "now";
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "now";
  }
}

const senderMeta: Record<string, { label: string; tone: string }> = {
  owner: { label: "Owner", tone: "bg-text-primary text-bg-elevated" },
  converza: { label: "Converza", tone: "bg-accent-dim text-accent" },
  milo: { label: "Milo", tone: "bg-warning-dim text-warning" },
  sleyz: { label: "Sleyz", tone: "bg-success-dim text-success" },
  vea: { label: "Vea", tone: "bg-accent-dim text-accent" },
};

export default function SquadPage() {
  const [messages, setMessages] = useState<SwitchboardMessage[]>([]);
  const [steps, setSteps] = useState<SwitchboardStep[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [messageData, activityData] = await Promise.all([
      fetchSquadMessages(),
      fetchSquadActivity(),
    ]);
    setMessages(messageData.messages || []);
    setSteps(activityData.steps || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load squad");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load().catch(() => {});
    }, 3000);
    return () => window.clearInterval(id);
  }, [load]);

  const recentSteps = useMemo(() => steps.slice(-12).reverse(), [steps]);

  async function submit() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendSquadMessage(text);
      setInput("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to send squad message");
    } finally {
      setSending(false);
    }
  }

  async function handleHitl(
    draftId: string,
    action: "approve" | "reject" | "edit",
  ) {
    const edited =
      action === "edit"
        ? window.prompt("Edit the draft before approving:", "") || ""
        : undefined;
    try {
      await resolveHitlDraft(draftId, action, edited);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to resolve draft");
    }
  }

  return (
    <WorkspaceShell title="Squad Chat" subtitle="cross-agent routing and approvals">
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[1.45fr_0.8fr]">
        <div className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-8 md:px-8">
            <p className="max-w-2xl text-[14px] leading-relaxed text-text-secondary">
              Route work by tagging <code>@Milo</code>, <code>@Sleyz</code>, or <code>@Vea</code>.
              Customer-facing drafts will pause here for approval.
            </p>
            {error && (
              <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
                {error}
              </p>
            )}
            {loading && <p className="text-[13px] text-text-muted">Loading squad…</p>}

            <div className="space-y-3">
              {messages.map((message) => {
                const meta = senderMeta[message.sender_slug] || senderMeta.converza;
                return (
                  <div key={message.id} className="rounded-2xl border border-border bg-bg-elevated p-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${meta.tone}`}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-text-muted">{formatTime(message.created_at)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-primary">
                      {message.content}
                    </p>
                    {message.hitl_draft_id && !message.content.toLowerCase().includes("hitl approved") && !message.content.toLowerCase().includes("hitl rejected") && !message.content.toLowerCase().includes("hitl edited") && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleHitl(message.hitl_draft_id as string, "approve")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-text-primary px-3 py-1.5 text-[12px] font-medium text-bg-elevated"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleHitl(message.hitl_draft_id as string, "edit")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] text-text-primary"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleHitl(message.hitl_draft_id as string, "reject")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] text-text-primary"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border bg-bg-primary px-6 py-4 md:px-8">
            <div className="flex items-end gap-3 rounded-2xl border border-border bg-bg-elevated p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                rows={3}
                placeholder="Message the squad… try '@Milo give me 3 new hooks' or '@Sleyz draft a reply for this lead'"
                className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={sending}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-text-primary text-bg-elevated disabled:opacity-60"
                aria-label="Send"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-medium text-text-primary">Agent activity</h2>
            <Link href="/agents" className="text-[12px] text-accent hover:underline">
              Open agents
            </Link>
          </div>
          <div className="space-y-3">
            {recentSteps.map((step) => (
              <div key={step.id} className="rounded-xl border border-border bg-bg-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    {step.agent_slug}
                  </span>
                  <span className="text-[11px] text-text-muted">{formatTime(step.created_at)}</span>
                </div>
                <p className="mt-2 text-[13px] text-text-primary">{step.step_label}</p>
                <p className="mt-1 text-[12px] text-text-secondary">
                  {step.step_status}
                  {step.detail ? ` · ${step.detail}` : ""}
                </p>
              </div>
            ))}
            {!loading && recentSteps.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-bg-elevated p-4 text-[13px] text-text-muted">
                Activity will appear here when the squad starts working.
              </p>
            )}
          </div>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
