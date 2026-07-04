"use client";

import { useEffect, useState } from "react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import {
  ApiError,
  fetchWorkspace,
  type CompetitorRival,
} from "@/lib/converza-api";

export default function CompetitorRadarWorkspace() {
  const [rivals, setRivals] = useState<CompetitorRival[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWorkspace<{ rivals: CompetitorRival[] }>(
          "/workspace/competitors",
        );
        if (!cancelled) {
          setRivals(data.rivals || []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load competitors");
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
    <WorkspaceShell title="Competitor Radar" subtitle="live watchlist">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <p className="mb-6 text-[14px] text-text-secondary">
          Brands Milo monitors — from your Brand Passport. Ask in the Master Feed:{" "}
          <code className="rounded bg-bg-tertiary px-1 font-mono text-[12px]">
            @Milo update competitor list
          </code>
        </p>
        {error && (
          <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
        {loading && <p className="text-[13px] text-text-muted">Loading watchlist…</p>}
        {!loading && rivals.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-text-muted">
            No competitors yet — add them in Settings → Brand Passport.
          </p>
        )}
        <ul className="space-y-3">
          {rivals.map((r) => (
            <li
              key={r.name}
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-bg-elevated px-4 py-4"
            >
              <div>
                <p className="text-[14px] font-medium">{r.name}</p>
                <p className="mt-1 text-[13px] text-text-secondary">{r.signal}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={
                    r.severity === "high"
                      ? "font-mono text-[9px] uppercase tracking-[0.14em] text-error"
                      : r.severity === "med"
                        ? "font-mono text-[9px] uppercase tracking-[0.14em] text-warning"
                        : "font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted"
                  }
                >
                  {r.severity}
                </span>
                <p className="mt-1 font-mono text-[9px] text-text-muted">{r.cadence}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceShell>
  );
}
