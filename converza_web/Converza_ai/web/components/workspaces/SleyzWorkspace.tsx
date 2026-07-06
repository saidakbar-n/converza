"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchProspectMessages,
  fetchWorkspace,
  updateProspectCondition,
  type PipelineLead,
  type PipelineResponse,
  type ProspectCondition,
  type ProspectMessage,
} from "@/lib/converza-api";

const columns = ["Warming Up", "Hesitating", "Ready to Pay"] as const;

const STAGE_TO_CONDITION: Record<string, ProspectCondition> = {
  "Warming Up": "cold",
  Hesitating: "warm",
  "Ready to Pay": "purchasing",
};

const CONDITION_OPTIONS: { value: ProspectCondition; label: string }[] = [
  { value: "cold", label: "Cold — Warming Up" },
  { value: "warm", label: "Warm — Hesitating" },
  { value: "purchasing", label: "Purchasing — Ready to Pay" },
  { value: "closed", label: "Closed" },
];

function formatUpdatedAt(ts?: string): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function formatMessageTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return ts;
  }
}

export default function SleyzWorkspace() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PipelineLead | null>(null);
  const [messages, setMessages] = useState<ProspectMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);

  const loadPipeline = useCallback(async () => {
    const data = await fetchWorkspace<PipelineResponse>("/workspace/pipeline");
    setLeads(data.leads || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadPipeline();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load pipeline");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPipeline]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    (async () => {
      try {
        const data = await fetchProspectMessages(selected.id);
        if (!cancelled) setMessages(data.messages || []);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function handleStageChange(condition: ProspectCondition) {
    if (!selected) return;
    setStageSaving(true);
    setError(null);
    try {
      const result = await updateProspectCondition(selected.id, condition);
      const updated: PipelineLead = {
        ...selected,
        condition,
        stage: result.stage,
      };
      setSelected(updated);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      await loadPipeline();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update stage");
    } finally {
      setStageSaving(false);
    }
  }

  return (
    <WorkspaceShell title="Sleyz" subtitle="sales & pipeline">
      <div className="relative flex h-full flex-col px-4 py-6 md:px-8">
        <p className="mb-6 max-w-xl text-[13.5px] text-text-secondary">
          Live prospects from Telegram Business DMs — synced from Supabase{" "}
          <code className="rounded bg-bg-tertiary px-1 font-mono text-[11px]">client_condition</code>.
        </p>
        {error && (
          <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
        {loading && (
          <p className="text-[13px] text-text-muted">Loading pipeline…</p>
        )}
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          {columns.map((stage) => (
            <div
              key={stage}
              className="flex flex-col rounded-xl border border-border bg-bg-secondary/50 p-3"
            >
              <h3 className="mb-3 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                {stage}
              </h3>
              <div className="space-y-2">
                {leads
                  .filter((l) => l.stage === stage)
                  .map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelected(lead)}
                      className={clsx(
                        "w-full rounded-lg border bg-bg-elevated p-3 text-left transition-colors hover:border-border-hover",
                        selected?.id === lead.id
                          ? "border-accent/40 ring-1 ring-accent/20"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">{lead.name}</span>
                        <span className="font-mono text-[8px] uppercase text-text-muted">
                          {lead.channel}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[12px] text-text-secondary">
                        {lead.last_message || "—"}
                      </p>
                    </button>
                  ))}
                {!loading && leads.filter((l) => l.stage === stage).length === 0 && (
                  <p className="px-1 text-[12px] text-text-muted">No leads in this stage.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <>
            <button
              type="button"
              aria-label="Close prospect detail"
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setSelected(null)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-bg-primary shadow-xl">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-medium">{selected.name}</h2>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {selected.channel} · {selected.stage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-tertiary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <dl className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <dt className="text-text-muted">Last message</dt>
                    <dd className="mt-1 text-text-secondary">{selected.last_message || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Updated</dt>
                    <dd className="mt-1 text-text-secondary">
                      {formatUpdatedAt(selected.updated_at)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <label
                    htmlFor="prospect-stage"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                  >
                    Stage
                  </label>
                  <select
                    id="prospect-stage"
                    disabled={stageSaving}
                    value={selected.condition || STAGE_TO_CONDITION[selected.stage] || "cold"}
                    onChange={(e) =>
                      handleStageChange(e.target.value as ProspectCondition)
                    }
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary"
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-text-muted">
                    Message history
                  </h3>
                  {messagesLoading && (
                    <p className="text-[13px] text-text-muted">Loading messages…</p>
                  )}
                  {!messagesLoading && messages.length === 0 && (
                    <p className="text-[13px] text-text-muted">No messages yet.</p>
                  )}
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className={clsx(
                          "rounded-lg border px-3 py-2 text-[12.5px]",
                          m.direction === "inbound"
                            ? "border-border bg-bg-elevated"
                            : "border-accent/20 bg-accent-dim/30",
                        )}
                      >
                        <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase text-text-muted">
                          <span>{m.direction === "inbound" ? "Lead" : m.sent_by}</span>
                          <span>{formatMessageTime(m.created_at)}</span>
                        </div>
                        <p className="text-text-secondary">{m.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>
    </WorkspaceShell>
  );
}
