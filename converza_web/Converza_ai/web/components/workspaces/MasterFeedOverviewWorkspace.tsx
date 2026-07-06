"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, Users, Video } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { ApiError, fetchWorkspace, type DashboardResponse } from "@/lib/converza-api";

export default function MasterFeedOverviewWorkspace() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWorkspace<DashboardResponse>("/workspace/dashboard");
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = data?.metrics;
  const ledger = data?.ledger || [];

  return (
    <WorkspaceShell title="The Overlook" subtitle="command center overview">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <p className="mb-8 max-w-lg text-[14.5px] leading-relaxed text-text-secondary">
          Your Manager feed is locked on the left. Pick a department in the sidebar — Milo,
          Sleyz, or Vea — and this pane becomes their live workspace. Route direct orders with{" "}
          <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[12px]">@Milo</code>{" "}
          in the Master Feed.
        </p>

        {error && (
          <p className="mb-6 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Revenue (MTD)", value: loading ? "…" : metrics?.revenue_mtd ?? "—", icon: Activity },
            { label: "Active leads", value: loading ? "…" : metrics?.active_leads ?? "—", icon: Users },
            { label: "Rendered videos", value: loading ? "…" : metrics?.rendered_videos ?? "—", icon: Video },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
              className="rounded-2xl border border-border bg-bg-elevated p-5"
            >
              <m.icon size={14} className="mb-2 text-text-muted" />
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                {m.label}
              </p>
              <p className="mt-2 text-[26px] font-medium tracking-[-0.02em]">{m.value}</p>
            </motion.div>
          ))}
        </div>

        {!loading && ledger.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-[14px] font-medium text-text-primary">Recent activity</h2>
            <ol className="space-y-2">
              {ledger.slice(0, 5).map((event, i) => (
                <li
                  key={`${event.id}-${i}`}
                  className="rounded-lg border border-border/60 bg-bg-elevated/60 px-4 py-3"
                >
                  <div className="flex gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    <span>{event.time}</span>
                    <span className="text-text-primary">{event.agent}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-text-secondary">{event.action}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Activity, name: "Milo", desc: "Market demand & hook tests" },
            { icon: Users, name: "Sleyz", desc: "Pipeline & Telegram intercepts" },
            { icon: Video, name: "Vea", desc: "Render queue & approve-to-post" },
          ].map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-dashed border-border p-5 text-center"
            >
              <agent.icon size={20} className="mx-auto mb-2 text-text-muted" />
              <p className="text-[14px] font-medium">{agent.name}</p>
              <p className="mt-1 text-[12px] text-text-muted">{agent.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
