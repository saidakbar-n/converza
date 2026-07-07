"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchSwitchboardAgents,
  type SwitchboardAgentSummary,
} from "@/lib/converza-api";
import { useEffect, useState } from "react";

const agentTone: Record<string, string> = {
  milo: "border-warning/20 bg-warning-dim/40",
  sleyz: "border-success/20 bg-success-dim/40",
  vea: "border-accent/20 bg-accent-dim/40",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<SwitchboardAgentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSwitchboardAgents();
        if (!cancelled) {
          setAgents(data.agents || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load agents");
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
    <WorkspaceShell title="Agents" subtitle="direct lines into the switchboard">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-10">
        <p className="max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Direct each specialist one-on-one, or use Squad Chat for cross-agent routing and approval
          flow.
        </p>

        {error && (
          <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        {loading && <p className="text-[13px] text-text-muted">Loading agents…</p>}

        <div className="grid gap-4 md:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className={`rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${agentTone[agent.id] || "border-border bg-bg-elevated"}`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                {agent.status}
              </div>
              <h2 className="mt-2 text-[20px] font-medium tracking-[-0.02em] text-text-primary">
                {agent.name}
              </h2>
              <p className="mt-1 text-[13px] text-text-secondary">{agent.role}</p>
              <p className="mt-6 text-[12px] text-text-muted">{agent.metric}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-text-primary">
                Open thread
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
