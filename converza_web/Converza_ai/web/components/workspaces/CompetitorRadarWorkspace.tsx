"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Save, X } from "lucide-react";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchBrandPassportByOrg,
  fetchWorkspace,
  upsertBrandPassport,
  type CompetitorRival,
} from "@/lib/converza-api";

function competitorNamesFromPassport(
  raw: (string | Record<string, unknown>)[] | undefined,
): string[] {
  if (!raw?.length) return [];
  return raw.map((entry) => {
    if (typeof entry === "string") return entry.trim();
    return String(entry.name || entry.brand || "").trim();
  }).filter(Boolean);
}

export default function CompetitorRadarWorkspace() {
  const [rivals, setRivals] = useState<CompetitorRival[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftNames, setDraftNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [passportSnapshot, setPassportSnapshot] = useState<Awaited<
    ReturnType<typeof fetchBrandPassportByOrg>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRivals = useCallback(async () => {
    const data = await fetchWorkspace<{ rivals: CompetitorRival[] }>("/workspace/competitors");
    setRivals(data.rivals || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      try {
        const [data, passport] = await Promise.all([
          fetchWorkspace<{ rivals: CompetitorRival[] }>("/workspace/competitors"),
          auth?.orgId ? fetchBrandPassportByOrg(auth.orgId) : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setRivals(data.rivals || []);
          setPassportSnapshot(passport);
          setDraftNames(competitorNamesFromPassport(passport?.competitors));
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

  function startEditing() {
    setDraftNames(rivals.map((r) => r.name));
    setEditing(true);
  }

  function addDraftName() {
    const v = newName.trim();
    if (!v || draftNames.includes(v)) return;
    setDraftNames((names) => [...names, v]);
    setNewName("");
  }

  async function saveCompetitors() {
    const auth = getStoredAuth();
    if (!auth?.orgId) {
      setError("Sign in via Telegram first.");
      return;
    }
    const passport = passportSnapshot || (await fetchBrandPassportByOrg(auth.orgId));
    if (!passport?.brand_name || !passport?.target_audience || !passport?.core_offer) {
      setError("Complete your brand passport in Settings before saving competitors.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertBrandPassport({
        org_id: auth.orgId,
        brand_name: passport.brand_name,
        industry: passport.industry,
        target_location: passport.target_location,
        target_audience: passport.target_audience,
        core_offer: passport.core_offer,
        tone: passport.tone,
        brand_voice: passport.brand_voice,
        pricing: passport.pricing,
        faq: passport.faq,
        objections: passport.objections,
        competitors: draftNames,
        raw_notes: passport.raw_notes,
      });
      setEditing(false);
      await loadRivals();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell title="Competitor Radar" subtitle="live watchlist">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-lg text-[14px] text-text-secondary">
            Brands Milo monitors — from your Brand Passport. Ask in the Master Feed:{" "}
            <code className="rounded bg-bg-tertiary px-1 font-mono text-[12px]">
              @Milo update competitor list
            </code>
          </p>
          {!editing && !loading && (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary hover:bg-bg-hover"
            >
              Edit list
            </button>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}
        {loading && <p className="text-[13px] text-text-muted">Loading watchlist…</p>}

        {editing && (
          <div className="mb-6 rounded-xl border border-border bg-bg-elevated p-4">
            <p className="mb-3 text-[13px] font-medium text-text-primary">Edit competitors</p>
            <ul className="mb-3 space-y-2">
              {draftNames.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) =>
                      setDraftNames((names) =>
                        names.map((n) => (n === name ? e.target.value : n)),
                      )
                    }
                    className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[13px] outline-none focus:border-text-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setDraftNames((names) => names.filter((n) => n !== name))}
                    className="text-text-muted hover:text-error"
                    aria-label={`Remove ${name}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mb-4 flex gap-2">
              <input
                placeholder="Add competitor…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDraftName()}
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[13px] outline-none focus:border-text-primary"
              />
              <button
                type="button"
                onClick={addDraftName}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[12px]"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveCompetitors}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated disabled:opacity-60"
              >
                <Save size={12} />
                {saving ? "Saving…" : "Save to passport"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-border px-4 py-2 text-[12px]"
              >
                Cancel
              </button>
              <Link
                href="/settings/brand"
                className="rounded-full border border-dashed border-border px-4 py-2 text-[12px] text-text-muted hover:text-text-primary"
              >
                Full brand settings
              </Link>
            </div>
          </div>
        )}

        {!loading && !editing && rivals.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-text-muted">
            No competitors yet —{" "}
            <button type="button" onClick={startEditing} className="text-accent hover:underline">
              add them here
            </button>{" "}
            or in{" "}
            <Link href="/settings/brand" className="text-accent hover:underline">
              Settings → Brand Passport
            </Link>
            .
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
