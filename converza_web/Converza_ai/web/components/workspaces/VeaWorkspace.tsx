"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchWorkspace,
  postWorkspace,
  type MediaJob,
  type MediaResponse,
} from "@/lib/converza-api";

export default function VeaWorkspace() {
  const [queue, setQueue] = useState<MediaJob[]>([]);
  const [completed, setCompleted] = useState<MediaJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchWorkspace<MediaResponse>("/workspace/media");
      setQueue(data.queue || []);
      setCompleted(data.completed || []);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load media queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(jobId: string) {
    try {
      await postWorkspace(`/workspace/media/${jobId}/approve`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Approve failed");
    }
  }

  return (
    <WorkspaceShell title="Vea" subtitle="media & editor">
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 md:px-10">
        {error && (
          <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
        <section>
          <h2 className="mb-4 text-[14px] font-medium">Render queue</h2>
          {loading && <p className="text-[13px] text-text-muted">Loading…</p>}
          {!loading && queue.length === 0 && (
            <p className="text-[13px] text-text-muted">
              No active renders — run a pipeline with ContentCreator_Agent.
            </p>
          )}
          <ul className="space-y-3">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-4"
              >
                <div>
                  <p className="text-[14px] font-medium">{item.title}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
                    {item.status} · {item.eta || "—"}
                  </p>
                </div>
                <div className="h-10 w-16 animate-pulse rounded-md bg-bg-tertiary" />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-medium">Completed assets</h2>
          <ul className="space-y-3">
            {completed.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-4"
              >
                <div>
                  <p className="text-[14px] font-medium">{item.title}</p>
                  <p className="mt-1 text-[12px] text-success">
                    {item.posted ? "Approved & queued for post" : "Ready for review"}
                  </p>
                </div>
                {!item.posted && (
                  <button
                    type="button"
                    onClick={() => approve(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    Approve & Post
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WorkspaceShell>
  );
}
