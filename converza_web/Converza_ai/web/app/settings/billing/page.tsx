"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchOrgSubscription,
  fetchSubscriptionPayments,
  startSubscriptionCheckout,
  type OrgSubscription,
  type SubscriptionPayment,
} from "@/lib/converza-api";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatUzs(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

function paymentPeriod(payment: SubscriptionPayment): string {
  const start = formatDate(payment.period_start);
  const end = formatDate(payment.period_end);
  if (start === "—" && end === "—") return formatDate(payment.paid_at);
  return `${start} – ${end}`;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<OrgSubscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth?.token) {
      setError("Sign in via Telegram to view billing status.");
      setLoading(false);
      return;
    }
    try {
      const [sub, history] = await Promise.all([
        fetchOrgSubscription(),
        fetchSubscriptionPayments(),
      ]);
      setSubscription(sub);
      setPayments(history);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load billing status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isActive =
    subscription?.status === "active" && subscription.plan === "Pilot";
  const planLabel = subscription?.plan || (loading ? "…" : "Free");
  const priceUzs =
    subscription?.amount_uzs ??
    subscription?.subscription_price_uzs ??
    null;
  const planNote = isActive
    ? `Active through ${formatDate(subscription?.current_period_end ?? null)}`
    : "Free tier — upgrade for full swarm access";

  async function handleUpgrade() {
    setCheckoutLoading(true);
    setCheckoutMessage(null);
    setError(null);
    try {
      const result = await startSubscriptionCheckout();
      if (result.already_active) {
        setCheckoutMessage(result.message);
        await load();
        return;
      }
      setCheckoutMessage(result.message);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Checkout failed";
      setError(msg);
      if (subscription?.upgrade_deep_link) {
        setCheckoutMessage(
          `Could not send invoice automatically. Open Telegram and complete payment there.`,
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Billing
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Plan, payment method, and invoice history.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}
      {checkoutMessage && (
        <p className="rounded-lg border border-success/20 bg-success-dim px-3 py-2 text-[13px] text-success">
          {checkoutMessage}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-bg-elevated p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Current plan
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
                {planLabel}
              </span>
              <span className="text-[14px] text-text-muted">{planNote}</span>
            </div>
            {!loading && priceUzs != null && (
              <p className="mt-2 text-[13px] text-text-secondary">
                {formatUzs(priceUzs)} / 30-day period
              </p>
            )}
            <ul className="mt-4 space-y-1.5 text-[13.5px] text-text-secondary">
              <li>· DM Closer + Co-Pilot</li>
              <li>· Telegram Business integration</li>
              <li>· Brand passport + agent swarm</li>
            </ul>
          </div>
          {!isActive && !loading && (
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_8px_22px_-8px_rgba(0,112,243,0.45)] transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Sending invoice…
                  </>
                ) : (
                  <>
                    Upgrade to Pilot
                    <ArrowRight
                      size={13}
                      strokeWidth={2.4}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
              {subscription?.upgrade_deep_link && (
                <a
                  href={subscription.upgrade_deep_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-text-muted hover:text-accent"
                >
                  Or open @{subscription.upgrade_bot_username}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 font-display text-[16px] text-text-secondary">
          Subscription
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4">
          {[
            { k: "Status", v: loading ? "…" : subscription?.status ?? "inactive" },
            {
              k: "Last payment",
              v: loading ? "…" : formatDate(subscription?.last_payment_at ?? null),
            },
            {
              k: "Period start",
              v: loading ? "…" : formatDate(subscription?.current_period_start ?? null),
            },
            {
              k: "Period end",
              v: loading ? "…" : formatDate(subscription?.current_period_end ?? null),
            },
          ].map((m) => (
            <div key={m.k} className="bg-bg-elevated px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                {m.k}
              </div>
              <div className="mt-1.5 text-[15px] font-medium tabular-nums text-text-primary">
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-[16px] text-text-secondary">
            Payment history
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-elevated">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            <span>Paid</span>
            <span>Period</span>
            <span>Amount</span>
            <span>Reference</span>
          </div>
          {!loading && payments.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-text-muted">
              No payments recorded yet. Upgrade to Pilot via Telegram to start.
            </p>
          )}
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-3.5 text-[13.5px] last:border-b-0"
            >
              <span className="text-text-primary">{formatDate(payment.paid_at)}</span>
              <span className="text-text-secondary">{paymentPeriod(payment)}</span>
              <span className="tabular-nums text-text-primary">
                {formatUzs(payment.amount_uzs)}
              </span>
              <span className="font-mono text-[11px] text-text-muted">
                {payment.telegram_payment_charge_id
                  ? payment.telegram_payment_charge_id.slice(0, 12)
                  : payment.id.slice(0, 8)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
