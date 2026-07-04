"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchBrandPassportByOrg,
  upsertBrandPassport,
} from "@/lib/converza-api";

export default function SettingsAudiencePage() {
  const [value, setValue] = useState("");
  const [brandName, setBrandName] = useState("");
  const [coreOffer, setCoreOffer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      if (!auth?.orgId) {
        if (!cancelled) {
          setError("Sign in via Telegram to edit audience.");
          setLoading(false);
        }
        return;
      }
      try {
        const passport = await fetchBrandPassportByOrg(auth.orgId);
        if (cancelled) return;
        setValue(passport?.target_audience || "");
        setBrandName(passport?.brand_name || "My brand");
        setCoreOffer(passport?.core_offer || "Not specified");
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load audience");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    const auth = getStoredAuth();
    if (!auth?.orgId) {
      setError("Sign in via Telegram first.");
      return;
    }
    const audience = value.trim();
    if (!audience) {
      setError("Audience description is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertBrandPassport({
        org_id: auth.orgId,
        brand_name: brandName,
        target_audience: audience,
        core_offer: coreOffer,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
        <div className="mb-10 flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary">
            <UsersRound size={16} strokeWidth={1.7} />
          </span>
          <div>
            <h2 className="text-[22px] font-medium tracking-[-0.015em] text-text-primary">
              Target Audience.
            </h2>
            <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-text-secondary">
              A clear picture of the buyer. Saved to your Brand Passport in Supabase.
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
            {error}
          </p>
        )}

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          placeholder="Describe your buyer in one paragraph — who they are, what they do, what they want, what they fear, where they hang out online."
          rows={8}
          className="w-full resize-none rounded-2xl border border-border bg-bg-elevated p-5 text-[14.5px] leading-[1.65] text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />

        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            {value.length} chars · brand_passports.target_audience
          </span>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="rounded-full bg-text-primary px-5 py-2 text-[12.5px] font-medium text-bg-elevated transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
          >
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
