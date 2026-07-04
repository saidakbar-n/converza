"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  fetchConnectionStatus,
  fetchCopilotStatus,
  type ConnectionStatus,
  type CopilotStatus,
} from "@/lib/converza-api";

/** Onboarding banner: Telegram Business + brand passport for bot DM flows. */
export default function OrgSetupBanner() {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [copilot, setCopilot] = useState<CopilotStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [conn, cop] = await Promise.all([
          fetchConnectionStatus(),
          fetchCopilotStatus(),
        ]);
        if (!cancelled) {
          setConnection(conn);
          setCopilot(cop);
        }
      } catch {
        // auth guard ensures session; ignore transient errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !connection) return null;

  const needsTelegram = !connection.connected;
  const needsPassport = !copilot?.ready;
  if (!needsTelegram && !needsPassport) return null;

  return (
    <div className="mx-4 mt-3 shrink-0 rounded-xl border border-warning/25 bg-warning-dim px-4 py-3 md:mx-6">
      <div className="flex items-start gap-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1 space-y-2 text-[13px] leading-relaxed text-text-secondary">
          <p className="font-medium text-text-primary">Finish setup to connect bots to your brand</p>
          <ul className="space-y-1.5">
            {needsPassport && (
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                <span>
                  Complete your{" "}
                  <Link href="/settings/brand" className="font-medium text-accent hover:underline">
                    Brand Passport
                  </Link>{" "}
                  {copilot?.reason ? `— ${copilot.reason}` : "so Co-Pilot and @Sleyz know your offer."}
                </span>
              </li>
            )}
            {needsTelegram && (
              <li className="flex items-start gap-2">
                <span className="text-warning">•</span>
                <span>
                  Link Telegram Business in{" "}
                  <Link
                    href="/settings/integrations"
                    className="font-medium text-accent hover:underline"
                  >
                    Integrations
                  </Link>{" "}
                  so the sales bot can read and reply to DMs.
                </span>
              </li>
            )}
            {connection.subscription_active && (
              <li className="flex items-center gap-2 text-success">
                <CheckCircle2 size={13} />
                <span>Subscription active</span>
              </li>
            )}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-text-muted hover:bg-bg-hover"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
