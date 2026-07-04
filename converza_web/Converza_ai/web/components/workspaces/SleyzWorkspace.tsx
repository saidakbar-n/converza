"use client";

import { useEffect, useState } from "react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchWorkspace,
  type PipelineLead,
  type PipelineResponse,
} from "@/lib/converza-api";

const columns = ["Warming Up", "Hesitating", "Ready to Pay"] as const;

export default function SleyzWorkspace() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWorkspace<PipelineResponse>("/workspace/pipeline");
        if (!cancelled) {
          setLeads(data.leads || []);
          setError(null);
        }
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
  }, []);

  return (
    <WorkspaceShell title="Sleyz" subtitle="sales & pipeline">
      <div className="flex h-full flex-col px-4 py-6 md:px-8">
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
                    <article
                      key={lead.id}
                      className="rounded-lg border border-border bg-bg-elevated p-3"
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
                    </article>
                  ))}
                {!loading && leads.filter((l) => l.stage === stage).length === 0 && (
                  <p className="px-1 text-[12px] text-text-muted">No leads in this stage.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
