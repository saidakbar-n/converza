"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ArrowUpRight, ListFilter, ShieldCheck } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchPendingHitl,
  fetchWorkspace,
  resolveHitlDraft,
  type DashboardResponse,
  type HitlDraftRow,
} from "@/lib/converza-api";

export default function DashboardWorkspace() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [pending, setPending] = useState<HitlDraftRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dashboard, hitl] = await Promise.all([
          fetchWorkspace<DashboardResponse>("/workspace/dashboard"),
          fetchPendingHitl(),
        ]);
        if (!cancelled) {
          setData(dashboard);
          setPending(hitl.drafts || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load dashboard");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = data?.metrics;
  const ledger = data?.ledger || [];
  const approvals = pending.map((draft) => ({
    id: draft.id,
    eyebrow: `${draft.agent_slug || "agent"} · pending`,
    title: "Review swarm draft",
    body: (draft.draft_content || draft.context_summary || "").slice(0, 240),
    impact: "HITL approval",
  }));

  const visibleApprovals = approvals.filter((a) => !dismissed.has(a.id));

  async function handleApproval(draftId: string, action: "approve" | "reject") {
    try {
      await resolveHitlDraft(draftId, action);
      setPending((rows) => rows.filter((row) => row.id !== draftId));
      setDismissed((s) => new Set(s).add(draftId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to resolve draft");
    }
  }

  return (
    <WorkspaceShell
      title="Dashboard"
      subtitle="macro metrics"
      badge={
        <span className="inline-flex items-center gap-2 rounded-full border border-success/15 bg-success-dim px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      }
    >
      <div className="mx-auto grid max-w-[1100px] gap-8 px-6 py-8 md:grid-cols-3 md:px-10">
        {error && (
          <p className="md:col-span-3 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
        <div className="md:col-span-3 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total revenue", value: metrics?.revenue_mtd ?? "—" },
            { label: "Active leads", value: metrics?.active_leads ?? "—" },
            { label: "Rendered videos", value: metrics?.rendered_videos ?? "—" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-border bg-bg-elevated p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                {m.label}
              </p>
              <p className="mt-2 text-[28px] font-medium tracking-[-0.02em]">{m.value}</p>
            </div>
          ))}
        </div>

        <section className="md:col-span-2">
          <header className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-medium">Swarm ledger</h2>
            <button className="inline-flex items-center gap-1 text-[12px] text-text-muted">
              <ListFilter size={12} /> Filter
            </button>
          </header>
          <ol className="space-y-2">
            {ledger.length === 0 && (
              <li className="text-[13px] text-text-muted">No recent DM activity.</li>
            )}
            {ledger.map((event, i) => (
              <motion.li
                key={`${event.id}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="rounded-lg border border-border/60 bg-bg-elevated/60 px-4 py-3"
              >
                <div className="flex gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  <span>{event.time}</span>
                  <span className="text-text-primary">{event.agent}</span>
                </div>
                <p className="mt-1 text-[13px] text-text-secondary">{event.action}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section>
          <header className="mb-5">
            <h2 className="text-[15px] font-medium">Approval queue</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {visibleApprovals.length} waiting
            </p>
          </header>
          <AnimatePresence mode="popLayout">
            {visibleApprovals.map((ap) => (
              <motion.article
                key={ap.id}
                layout
                exit={{ opacity: 0, scale: 0.98 }}
                className="mb-4 rounded-2xl border border-border bg-bg-elevated p-4"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                  {ap.eyebrow}
                </p>
                <h3 className="mt-2 text-[14px] font-medium">{ap.title}</h3>
                <p className="mt-2 text-[13px] text-text-secondary">{ap.body}</p>
                <p className="mt-2 inline-flex items-center gap-1 font-mono text-[9px] uppercase text-success">
                  <ArrowUpRight size={10} /> {ap.impact}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleApproval(ap.id, "reject")}
                    className="rounded-full border border-border px-3 py-1 text-[12px]"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApproval(ap.id, "approve")}
                    className="inline-flex items-center gap-1 rounded-full bg-text-primary px-3 py-1 text-[12px] text-bg-elevated"
                  >
                    <Check size={11} /> Approve
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          {visibleApprovals.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <ShieldCheck size={20} className="mx-auto mb-2 text-text-muted" />
              <p className="text-[13px]">Caught up — swarm is autonomous.</p>
              <Link href="/squad" className="mt-2 inline-block text-[12px] text-accent hover:underline">
                Open Squad Chat
              </Link>
            </div>
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
}
