"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Zap,
  Film,
  TrendingUp,
  Clock,
  CheckCircle2,
  PauseCircle,
  Loader2,
  ArrowUpRight,
  X,
} from "lucide-react";
import clsx from "clsx";
import DagVisualizer, {
  type DagNode,
  type DagPlan,
  type NodeStatus,
} from "@/components/dag/DagVisualizer";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchBrandPassportByOrg,
  fetchPipelineRun,
  fetchPipelineRuns,
  pollPipelineStatus,
  startPipeline,
  type PipelineRunDetail,
  type PipelineRunSummary,
} from "@/lib/converza-api";

function mapNodeStatus(raw?: string): NodeStatus {
  const v = (raw || "pending").toLowerCase();
  if (v === "complete" || v === "completed") return "complete";
  if (v === "running") return "running";
  if (v === "failed") return "failed";
  if (v === "stub") return "stub";
  return "pending";
}

function mapDagStatus(status: string): "running" | "complete" | "partial" | "failed" {
  const v = status.toLowerCase();
  if (v === "running" || v === "pending") return "running";
  if (v === "complete" || v === "completed") return "complete";
  if (v === "partial") return "partial";
  return "failed";
}

function buildDagPlan(detail: PipelineRunDetail): DagPlan {
  const plan = detail.run.dag_plan;
  const nodeRuns = new Map(detail.nodes.map((n) => [n.node_id, n]));

  if (!plan?.nodes?.length) {
    return {
      strategic_thesis: detail.run.user_message || "Pipeline run",
      campaign_name: "Pipeline run",
      target_platforms: [],
      nodes: detail.nodes.map((n) => ({
        node_id: n.node_id,
        agent_type: n.agent_type,
        status: mapNodeStatus(n.status),
        depends_on: [],
        output: n.output_payload,
      })),
    };
  }

  return {
    strategic_thesis: plan.strategic_thesis || detail.run.user_message,
    campaign_name: plan.campaign_name || "Campaign",
    target_platforms: plan.target_platforms || [],
    nodes: plan.nodes.map((planNode) => {
      const runNode = nodeRuns.get(planNode.node_id);
      return {
        node_id: planNode.node_id,
        agent_type: planNode.agent_type,
        status: mapNodeStatus(runNode?.status),
        depends_on: planNode.depends_on || [],
        brief: (runNode?.input_payload || planNode.brief) as Record<string, unknown> | undefined,
        output: runNode?.output_payload as Record<string, unknown> | undefined,
      } satisfies DagNode;
    }),
  };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return iso;
  }
}

function displayName(run: PipelineRunSummary): string {
  return run.campaign_name || run.user_message.slice(0, 60) || "Untitled run";
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof CheckCircle2; bg: string; text: string }
> = {
  running: {
    label: "Running",
    icon: Loader2,
    bg: "bg-accent-dim",
    text: "text-accent",
  },
  pending: {
    label: "Pending",
    icon: Loader2,
    bg: "bg-accent-dim",
    text: "text-accent",
  },
  complete: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-success/10",
    text: "text-success",
  },
  partial: {
    label: "Partial",
    icon: PauseCircle,
    bg: "bg-warning/10",
    text: "text-warning",
  },
  cancelled: {
    label: "Cancelled",
    icon: PauseCircle,
    bg: "bg-warning/10",
    text: "text-warning",
  },
  failed: {
    label: "Failed",
    icon: PauseCircle,
    bg: "bg-error/10",
    text: "text-error",
  },
};

export default function ProjectsPage() {
  const [runs, setRuns] = useState<PipelineRunSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<PipelineRunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [startMessage, setStartMessage] = useState(
    "Create a short-form video campaign for our core offer on TikTok and Instagram.",
  );

  const loadRuns = useCallback(async () => {
    const data = await fetchPipelineRuns();
    setRuns(data.runs || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadRuns();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load pipeline runs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRuns]);

  const loadDetail = useCallback(async (runId: string, poll = false) => {
    setDetailLoading(true);
    try {
      const detail = poll
        ? await pollPipelineStatus(runId)
        : await fetchPipelineRun(runId);
      setRunDetail(detail);
      setError(null);
      return detail;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load run detail");
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setRunDetail(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const isRunning = useMemo(() => {
    const status = runDetail?.run.status?.toLowerCase();
    return status === "running" || status === "pending";
  }, [runDetail?.run.status]);

  useEffect(() => {
    if (!selectedId || !isRunning) return;
    const id = window.setInterval(() => {
      loadDetail(selectedId, true);
    }, 3000);
    return () => window.clearInterval(id);
  }, [selectedId, isRunning, loadDetail]);

  async function handleStartPipeline() {
    const auth = getStoredAuth();
    if (!auth?.orgId) {
      setError("Sign in via Telegram first.");
      return;
    }
    const msg = startMessage.trim();
    if (!msg) return;

    setStarting(true);
    setError(null);
    try {
      let brandId: string | null = null;
      const passport = await fetchBrandPassportByOrg(auth.orgId);
      brandId = passport?.id ?? null;

      const { runId } = await startPipeline({
        message: msg,
        brandId,
        userId: auth.orgId,
      });

      setShowStart(false);
      await loadRuns();
      if (runId) {
        setSelectedId(runId);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to start pipeline");
    } finally {
      setStarting(false);
    }
  }

  const activeCampaigns = runs.filter((r) =>
    ["running", "pending"].includes(r.status.toLowerCase()),
  ).length;
  const completedCampaigns = runs.filter((r) =>
    ["complete", "completed"].includes(r.status.toLowerCase()),
  ).length;

  const dagPlan = runDetail ? buildDagPlan(runDetail) : null;
  const dagStatus = runDetail ? mapDagStatus(runDetail.run.status) : "running";

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 pl-14 md:pl-8 md:px-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-medium tracking-[-0.01em] text-text-primary">
            Projects
          </h1>
          <span className="hidden font-display text-[18px] text-text-muted sm:block">
            pipeline runs
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowStart(true)}
          disabled={starting}
          className="flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-[12.5px] font-medium text-bg-primary transition-transform duration-150 hover:scale-[1.02] disabled:opacity-50"
        >
          {starting ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} strokeWidth={2.4} />}
          <span className="hidden sm:inline">Run pipeline</span>
          <span className="sm:hidden">Run</span>
        </button>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex-1 overflow-y-auto bg-bg-primary p-4 md:p-6">
          {error && (
            <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
              {error}
            </p>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              {
                label: "Active Runs",
                value: activeCampaigns.toString(),
                icon: Loader2,
                color: "text-accent",
                bg: "bg-accent-dim",
              },
              {
                label: "Total Runs",
                value: runs.length.toString(),
                icon: Film,
                color: "text-accent",
                bg: "bg-accent/8",
              },
              {
                label: "Completed",
                value: completedCampaigns.toString(),
                icon: TrendingUp,
                color: "text-success",
                bg: "bg-success/8",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-bg-secondary p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-text-muted">
                    {kpi.label}
                  </span>
                  <div
                    className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      kpi.bg,
                    )}
                  >
                    <kpi.icon size={16} className={kpi.color} />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {loading ? "—" : kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
            <div className="hidden border-b border-border px-5 py-3 lg:grid lg:grid-cols-[2fr_1fr_1fr_0.6fr] lg:gap-4">
              {["Campaign", "Status", "Started", ""].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                >
                  {h}
                </span>
              ))}
            </div>

            {loading && (
              <p className="px-5 py-8 text-[13px] text-text-muted">Loading runs…</p>
            )}
            {!loading && runs.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-text-muted">
                No pipeline runs yet. Click Run pipeline to start your first campaign.
              </p>
            )}

            {runs.map((run, i) => {
              const sc = statusConfig[run.status.toLowerCase()] || statusConfig.failed;
              const StatusIcon = sc.icon;
              const selected = selectedId === run.id;

              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedId(run.id)}
                  className={clsx(
                    "w-full p-4 text-left transition-colors hover:bg-bg-tertiary lg:grid lg:grid-cols-[2fr_1fr_1fr_0.6fr] lg:items-center lg:gap-4 lg:px-5 lg:py-3.5",
                    i < runs.length - 1 && "border-b border-border",
                    selected && "bg-bg-tertiary/80",
                  )}
                >
                  <div>
                    <p className="text-[13px] font-medium text-text-primary">
                      {displayName(run)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {(run.target_platforms || []).map((p) => (
                        <span
                          key={p}
                          className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-text-muted"
                        >
                          {p}
                        </span>
                      ))}
                      <span className="ml-1 flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock size={10} />
                        {formatRelativeTime(run.started_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 lg:mt-0">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        sc.bg,
                        sc.text,
                      )}
                    >
                      <StatusIcon
                        size={12}
                        className={clsx(
                          ["running", "pending"].includes(run.status.toLowerCase()) &&
                            "animate-spin",
                        )}
                      />
                      {sc.label}
                    </span>
                  </div>

                  <span className="mt-2 hidden font-mono text-[11px] text-text-muted lg:block">
                    {run.stage || "—"}
                  </span>

                  <span className="mt-2 hidden justify-end lg:flex">
                    <ArrowUpRight size={14} className="text-text-muted" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedId && (
          <aside className="flex w-full flex-col border-t border-border bg-bg-secondary lg:w-[min(480px,42%)] lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[13px] font-medium">Run detail</h2>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-tertiary lg:hidden"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {detailLoading && !runDetail && (
                <p className="px-3 py-6 text-[13px] text-text-muted">Loading DAG…</p>
              )}
              {dagPlan && (
                <DagVisualizer
                  plan={dagPlan}
                  runId={selectedId}
                  dagStatus={dagStatus}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {showStart && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => !starting && setShowStart(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-bg-primary p-6 shadow-xl">
            <h2 className="text-[15px] font-medium">Run pipeline</h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Describe the campaign you want the Manager Agent to plan and execute.
            </p>
            <textarea
              value={startMessage}
              onChange={(e) => setStartMessage(e.target.value)}
              rows={4}
              className="mt-4 w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={starting}
                onClick={() => setShowStart(false)}
                className="rounded-lg px-4 py-2 text-[13px] text-text-muted hover:bg-bg-tertiary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={starting || !startMessage.trim()}
                onClick={handleStartPipeline}
                className="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated disabled:opacity-50"
              >
                {starting && <Loader2 size={13} className="animate-spin" />}
                Start
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
