"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  ApiError,
  createAgentMemory,
  deleteAgentMemory,
  fetchAgentMemories,
  wipeAgentMemories,
  type AgentMemoryRow,
  type SwitchboardAgentId,
} from "@/lib/converza-api";

function formatWhen(value?: string) {
  if (!value) return "Recently";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<AgentMemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [agentSlug, setAgentSlug] = useState<SwitchboardAgentId>("milo");

  const load = useCallback(async () => {
    const data = await fetchAgentMemories();
    setMemories(data.memories || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load memory");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function addMemory() {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createAgentMemory(text, agentSlug);
      setDraft("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save memory");
    } finally {
      setSaving(false);
    }
  }

  async function forget(memoryId: string) {
    setError(null);
    try {
      await deleteAgentMemory(memoryId);
      setMemories((rows) => rows.filter((row) => row.id !== memoryId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete memory");
    }
  }

  async function wipeAll() {
    if (!window.confirm("Wipe all pinned agent memory? This cannot be undone.")) return;
    setError(null);
    try {
      await wipeAgentMemories();
      setMemories([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to wipe memory");
    }
  }

  const bytes = memories.reduce((sum, row) => sum + (row.content?.length || 0), 0);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Agent memory
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Pinned facts the swarm reads on every run. Conversation history stays in agent threads;
          prune pins here when strategy changes.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-bg-elevated p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
            Scope
          </label>
          <select
            value={agentSlug}
            onChange={(e) => setAgentSlug(e.target.value as SwitchboardAgentId)}
            className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-[13px]"
          >
            <option value="milo">Milo</option>
            <option value="sleyz">Sleyz</option>
            <option value="vea">Vea</option>
          </select>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="e.g. Always credit photographer @askar.io on Instagram brand posts."
          className="w-full resize-none bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
        />
        <button
          type="button"
          onClick={() => void addMemory()}
          disabled={saving || !draft.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-[12.5px] font-medium text-bg-elevated disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Pin memory
        </button>
      </div>

      {loading && <p className="text-[13px] text-text-muted">Loading memory…</p>}

      <div className="space-y-3">
        {memories.map((m) => (
          <div
            key={m.id}
            className="group flex items-start gap-4 rounded-xl border border-border bg-bg-elevated p-4 transition-colors hover:border-border-hover"
          >
            <div className="flex-1">
              <p className="text-[14px] leading-relaxed text-text-primary">{m.content}</p>
              <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                <span>{m.agent_slug || "all"}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-text-muted" />
                <span>{m.source || "owner"}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-text-muted" />
                <span>{formatWhen(m.created_at)}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Forget this"
              onClick={() => void forget(m.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:bg-error/10 hover:text-error group-hover:opacity-100"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
        {!loading && memories.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-[13px] text-text-muted">
            No pinned memory yet. Add brand rules, budget caps, or channel preferences above.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {memories.length} memories · {(bytes / 1024).toFixed(1)} KB
        </span>
        <button
          type="button"
          onClick={() => void wipeAll()}
          className="text-[12.5px] font-medium text-error hover:underline"
        >
          Wipe all memory
        </button>
      </div>
    </div>
  );
}
