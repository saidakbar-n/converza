"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchBrandPassportByOrg,
  upsertBrandPassport,
  type BrandPassport,
} from "@/lib/converza-api";

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

function parseMarkets(location?: string): string[] {
  if (!location?.trim()) return [];
  return location
    .split(/[,;|/]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

function passportToForm(passport: BrandPassport | null) {
  return {
    brandName: passport?.brand_name || "",
    voice: passport?.tone || passport?.brand_voice || "",
    audience: passport?.target_audience || "",
    promise: passport?.core_offer || "",
    markets: parseMarkets(passport?.target_location),
    industry: passport?.industry || "",
  };
}

export default function BrandPage() {
  const [brandName, setBrandName] = useState("");
  const [voice, setVoice] = useState("");
  const [audience, setAudience] = useState("");
  const [promise, setPromise] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [newMarket, setNewMarket] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const syncBrandNameStorage = useCallback((name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    window.localStorage.setItem(BRAND_NAME_STORAGE_KEY, normalized);
    window.dispatchEvent(new Event("converza:brand-name-updated"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      if (!auth?.orgId) {
        if (!cancelled) {
          setError("Sign in via Telegram to load your brand passport.");
          setLoading(false);
        }
        return;
      }
      try {
        const passport = await fetchBrandPassportByOrg(auth.orgId);
        if (cancelled) return;
        const form = passportToForm(passport);
        setBrandName(form.brandName);
        setVoice(form.voice);
        setAudience(form.audience);
        setPromise(form.promise);
        setMarkets(form.markets.length ? form.markets : ["Uzbekistan"]);
        if (form.brandName) syncBrandNameStorage(form.brandName);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load brand passport");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncBrandNameStorage]);

  async function save() {
    const auth = getStoredAuth();
    if (!auth?.orgId) {
      setError("Sign in via Telegram first.");
      return;
    }
    const normalizedName = brandName.trim();
    const normalizedAudience = audience.trim();
    const normalizedPromise = promise.trim();
    if (!normalizedName || !normalizedAudience || !normalizedPromise) {
      setError("Brand name, audience, and core promise are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertBrandPassport({
        org_id: auth.orgId,
        brand_name: normalizedName,
        target_audience: normalizedAudience,
        core_offer: normalizedPromise,
        tone: voice.trim() || "Friendly, confident, and concise",
        brand_voice: voice.trim(),
        target_location: markets.join(", ") || "Uzbekistan",
      });
      syncBrandNameStorage(normalizedName);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addMarket() {
    const v = newMarket.trim();
    if (!v) return;
    setMarkets((m) => [...m, v]);
    setNewMarket("");
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Brand passport
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          The single source of truth the swarm reads before generating anything. Synced from Supabase via the Converza API.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}
      {loading && <p className="text-[13px] text-text-muted">Loading brand passport…</p>}

      <Field label="Brand name" hint="Shown in the sidebar and used as the workspace identity.">
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Voice & tone" hint="Three to five adjectives. The way the brand sounds in writing.">
        <textarea
          rows={2}
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Audience" hint="The buyer in one sentence — who they are, what they want.">
        <textarea
          rows={2}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Core promise" hint="What the brand actually delivers — the line on the box.">
        <input
          value={promise}
          onChange={(e) => setPromise(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Markets" hint="Where the ads should run. Each market gets its own copy register.">
        <div className="flex flex-wrap items-center gap-2">
          {markets.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-primary"
            >
              {m}
              <button
                onClick={() => setMarkets((arr) => arr.filter((x) => x !== m))}
                className="text-text-muted hover:text-error"
                aria-label={`Remove ${m}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            placeholder="Add market…"
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMarket()}
            disabled={loading}
            className="rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary outline-none placeholder-text-muted/70 focus:border-text-primary disabled:opacity-60"
          />
        </div>
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {savedAt ? `Saved at ${savedAt}` : "Saved to Supabase brand_passports"}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="group inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-[13.5px] font-medium text-bg-elevated transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
        >
          <Save size={13} strokeWidth={2.2} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.6fr] md:gap-10">
      <div>
        <div className="text-[14px] font-medium text-text-primary">{label}</div>
        {hint && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
