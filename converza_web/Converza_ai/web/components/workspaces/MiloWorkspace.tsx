"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { ApiError, fetchWorkspace, type MiloResponse } from "@/lib/converza-api";

export default function MiloWorkspace() {
  const [data, setData] = useState<MiloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWorkspace<MiloResponse>("/workspace/milo");
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load Milo workspace");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const demandSignals = data?.demand_signals || [];
  const hooks = data?.hooks || [];
  const needsPassport = !loading && demandSignals.length === 0 && hooks.length === 0;

  return (
    <WorkspaceShell title="Milo" subtitle="growth & strategy">
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 md:px-10">
        {error && (
          <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        {needsPassport && (
          <div className="rounded-xl border border-accent/30 bg-accent-dim/40 p-5">
            <h2 className="text-[14px] font-medium text-text-primary">
              Complete your brand passport
            </h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              Milo needs your core offer, audience, and market to generate demand signals and
              marketing hooks.
            </p>
            <Link
              href="/settings/brand"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated"
            >
              Open brand passport
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        <section>
          <h2 className="mb-4 text-[14px] font-medium">Live market demand</h2>
          {loading && <p className="text-[13px] text-text-muted">Loading…</p>}
          <div className="space-y-3">
            {demandSignals.map((d) => (
              <div key={d.market} className="rounded-xl border border-border bg-bg-elevated p-4">
                <div className="flex justify-between">
                  <span className="font-medium">{d.market}</span>
                  <span className="font-mono text-[9px] uppercase text-text-muted">
                    {d.confidence}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-text-secondary">{d.trend}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[14px] font-medium">Marketing hooks</h2>
          {hooks.length === 0 && !loading && (
            <p className="text-[13px] text-text-muted">
              Add a core offer in Brand Passport to seed hook variants.
            </p>
          )}
          <div className="space-y-2">
            {hooks.map((h) => (
              <div
                key={h.variant}
                className={`rounded-xl border px-4 py-3 ${
                  h.winner ? "border-success/30 bg-success-dim" : "border-border bg-bg-elevated"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase">Variant {h.variant}</span>
                  <span className="text-[12px] text-text-muted">CTR {h.ctr}</span>
                </div>
                <p className="mt-2 text-[13.5px]">{h.text}</p>
                {h.winner && (
                  <p className="mt-2 font-mono text-[9px] uppercase text-success">
                    Primary · from passport
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
