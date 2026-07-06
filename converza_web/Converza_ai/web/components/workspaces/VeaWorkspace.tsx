"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchWorkspace,
  postWorkspace,
  type MediaJob,
  type MediaResponse,
} from "@/lib/converza-api";

const POLL_MS = 30_000;

function outputLink(job: MediaJob): { href: string; label: string } | null {
  const urls = job.output_urls;
  if (!urls) return null;
  if (urls.video_url) return { href: urls.video_url, label: "Open video" };
  if (urls.asset_url) return { href: urls.asset_url, label: "Open asset" };
  if (urls.url) return { href: urls.url, label: "Open output" };
  if (urls.anchor_frame_url) return { href: urls.anchor_frame_url, label: "Anchor frame" };
  return null;
}

export default function VeaWorkspace() {
  const [queue, setQueue] = useState<MediaJob[]>([]);
  const [completed, setCompleted] = useState<MediaJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await fetchWorkspace<MediaResponse>("/workspace/media");
      setQueue(data.queue || []);
      setCompleted(data.completed || []);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load media queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") load(true);
    }
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  async function approve(jobId: string) {
    try {
      await postWorkspace(`/workspace/media/${jobId}/approve`);
      await load(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Approve failed");
    }
  }

  return (
    <WorkspaceShell title="Vea" subtitle="media & editor">
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 md:px-10">
        <div className="flex items-center justify-between">
          <p className="max-w-lg text-[13px] text-text-secondary">
            Renders from ContentCreator_Agent pipeline nodes — auto-refreshes every 30s.
          </p>
          <button
            type="button"
            onClick={() => load()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-tertiary disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        <section>
          <h2 className="mb-4 text-[14px] font-medium">Render queue</h2>
          {loading && (
            <div className="flex items-center gap-2 text-[13px] text-text-muted">
              <Loader2 size={14} className="animate-spin" />
              Loading render queue…
            </div>
          )}
          {!loading && queue.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-bg-secondary/40 px-4 py-8 text-center">
              <p className="text-[13px] text-text-muted">No active renders.</p>
              <p className="mt-1 text-[12px] text-text-muted/80">
                Start a pipeline from Projects — ContentCreator_Agent jobs appear here.
              </p>
            </div>
          )}
          <ul className="space-y-3">
            {queue.map((item) => {
              const link = outputLink(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{item.title}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                      {item.status} · {item.eta || "—"}
                    </p>
                    {link && (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                      >
                        <ExternalLink size={11} />
                        {link.label}
                      </a>
                    )}
                  </div>
                  <div className="ml-3 h-10 w-16 shrink-0 animate-pulse rounded-md bg-bg-tertiary" />
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-medium">Completed assets</h2>
          {!loading && completed.length === 0 && (
            <p className="text-[13px] text-text-muted">No completed assets yet.</p>
          )}
          <ul className="space-y-3">
            {completed.map((item) => {
              const link = outputLink(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{item.title}</p>
                    <p className="mt-1 text-[12px] text-success">
                      {item.posted ? "Approved & queued for post" : "Ready for review"}
                    </p>
                    {link && (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                      >
                        <ExternalLink size={11} />
                        {link.label}
                      </a>
                    )}
                  </div>
                  {!item.posted && (
                    <button
                      type="button"
                      onClick={() => approve(item.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated"
                    >
                      <Check size={12} strokeWidth={2.5} />
                      Approve & Post
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </WorkspaceShell>
  );
}
