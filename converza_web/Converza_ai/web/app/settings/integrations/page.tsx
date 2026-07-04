"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Plug } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import { ApiError, fetchAuthConfig, fetchConnectionStatus } from "@/lib/converza-api";

export default function SettingsIntegrationsPage() {
  const [connected, setConnected] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [salesBot, setSalesBot] = useState("ConverzaSales_bot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      if (!auth?.token) {
        if (!cancelled) {
          setError("Sign in via Telegram to view integration status.");
          setLoading(false);
        }
        return;
      }
      try {
        const [status, config] = await Promise.all([
          fetchConnectionStatus(),
          fetchAuthConfig(),
        ]);
        if (cancelled) return;
        setConnected(status.connected);
        setPaymentsEnabled(status.payments_enabled);
        setSalesBot(config.sales_bot_username || "ConverzaSales_bot");
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load integrations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const integrations = useMemo(
    () => [
      {
        id: "telegram",
        label: "Telegram Business",
        note: `Connect via @${salesBot}`,
        connected,
      },
      {
        id: "click",
        label: "Click Payments",
        note: "Invoice links in DM closer flows",
        connected: paymentsEnabled,
      },
      { id: "shopify", label: "Shopify", note: "Catalog, orders, customer events", connected: false },
      { id: "meta", label: "Meta Ads", note: "Facebook + Instagram ad accounts", connected: false },
      { id: "tiktok", label: "TikTok Ads", note: "Spark Ads + Display & Video 360", connected: false },
      { id: "ga4", label: "GA4", note: "Site analytics + attribution", connected: false },
      { id: "klaviyo", label: "Klaviyo", note: "Email & SMS lifecycle", connected: false },
      { id: "slack", label: "Slack", note: "Approval pings + daily digest", connected: false },
    ],
    [connected, paymentsEnabled, salesBot],
  );

  return (
    <div>
      <div className="mb-10 flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary">
          <Plug size={16} strokeWidth={1.7} />
        </span>
        <div>
          <h2 className="text-[22px] font-medium tracking-[-0.015em] text-text-primary">
            Connect the data the swarm reads from.
          </h2>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-text-secondary">
            Telegram Business and Click status come from your org record. Other connectors are coming soon.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}
      {loading && <p className="mb-4 text-[13px] text-text-muted">Loading connection status…</p>}

      {!loading && !connected && (
        <div className="mb-6 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-[13px] leading-relaxed text-text-secondary">
          <p className="font-medium text-text-primary">Link @{salesBot} to your Telegram Business account</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Open Telegram → Settings → Telegram Business → Chatbots</li>
            <li>Add @{salesBot} and grant message access</li>
            <li>
              Complete your{" "}
              <Link href="/settings/brand" className="text-accent hover:underline">
                Brand Passport
              </Link>{" "}
              so replies match your offer and tone
            </li>
          </ol>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        {integrations.map((int, i) => (
          <motion.div
            key={int.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.04 * i,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group flex items-center gap-4 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-bg-hover"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-secondary font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              {int.label.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium tracking-[-0.005em] text-text-primary">
                {int.label}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-text-muted">
                {int.note}
              </div>
            </div>
            {int.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success-dim px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-success">
                <Check size={10} strokeWidth={2.6} />
                Connected
              </span>
            ) : int.id === "telegram" || int.id === "click" ? (
              <span className="rounded-full border border-border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Not connected
              </span>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-full bg-bg-secondary px-4 py-1.5 text-[12px] font-medium text-text-muted"
              >
                Coming soon
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-[12.5px] leading-relaxed text-text-muted">
        Don&apos;t see what you need?{" "}
        <Link href="mailto:integrations@converza.ai" className="text-text-primary underline-offset-2 hover:underline">
          Tell us
        </Link>{" "}
        — we ship new connectors weekly.
      </p>
    </div>
  );
}
