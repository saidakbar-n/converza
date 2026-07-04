"use client";

import { motion } from "motion/react";
import { Activity, Users, Video } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";

const metrics = [
  { label: "Revenue (MTD)", value: "$12,480", delta: "+18%" },
  { label: "Active leads", value: "34", delta: "+6 today" },
  { label: "Rendered videos", value: "7", delta: "2 in queue" },
];

export default function MasterFeedOverviewWorkspace() {
  return (
    <WorkspaceShell title="The Overlook" subtitle="command center overview">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <p className="mb-8 max-w-lg text-[14.5px] leading-relaxed text-text-secondary">
          Your Manager feed is locked on the left. Pick a department in the sidebar — Milo,
          Sleyz, or Vea — and this pane becomes their live workspace. Route direct orders with{" "}
          <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[12px]">@Milo</code>{" "}
          in the Master Feed.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
              className="rounded-2xl border border-border bg-bg-elevated p-5"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
                {m.label}
              </p>
              <p className="mt-2 text-[26px] font-medium tracking-[-0.02em]">{m.value}</p>
              <p className="mt-1 text-[12px] text-success">{m.delta}</p>
            </motion.div>
          ))}
        </div>

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
