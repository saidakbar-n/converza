"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import {
  ApiError,
  fetchModelSettings,
  saveModelSettings,
  type ModelCatalogEntry,
  type ModelCatalogRole,
} from "@/lib/converza-api";

export default function ModelsPage() {
  const [roles, setRoles] = useState<ModelCatalogRole[]>([]);
  const [models, setModels] = useState<ModelCatalogEntry[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchModelSettings();
        if (!cancelled) {
          setRoles(data.roles || []);
          setModels(data.models || []);
          setPicks(data.picks || {});
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load model settings");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: Record<string, string>) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const result = await saveModelSettings(next);
      setPicks(result.picks);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save model settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Models
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Default LLM per role. Milo and Co-Pilot share strategist; Sleyz uses copywriter; Vea uses
          video. Changes apply on the next agent run.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-[13px] text-success">Saved — agents will use these models next run.</p>
      )}
      {loading && <p className="text-[13px] text-text-muted">Loading models…</p>}

      {roles.map((role) => (
        <div
          key={role.id}
          className="grid grid-cols-1 gap-4 border-b border-border pb-8 last:border-b-0 md:grid-cols-[1fr_1.6fr] md:gap-10"
        >
          <div>
            <div className="text-[14px] font-medium text-text-primary">{role.label}</div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{role.hint}</div>
          </div>
          <div className="space-y-2">
            {models.map((model) => {
              const active = picks[role.id] === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const next = { ...picks, [role.id]: model.id };
                    setPicks(next);
                    void persist(next);
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    active
                      ? "border-text-primary bg-bg-elevated shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      : "border-border bg-bg-elevated hover:border-border-hover",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                      active
                        ? "border-text-primary bg-text-primary text-bg-elevated"
                        : "border-border",
                    )}
                  >
                    {active && <Check size={11} strokeWidth={2.6} />}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[14px] font-medium text-text-primary">
                        {model.label}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                        {model.tag}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
                    {model.speed} · {model.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {saving && (
        <p className="inline-flex items-center gap-2 text-[12px] text-text-muted">
          <Loader2 size={14} className="animate-spin" />
          Saving…
        </p>
      )}
    </div>
  );
}
