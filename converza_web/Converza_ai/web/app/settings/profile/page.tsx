"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import { ApiError, fetchAuthMe } from "@/lib/converza-api";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [orgId, setOrgId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      if (!auth?.token) {
        if (!cancelled) {
          setError("Sign in via Telegram to view your profile.");
          setLoading(false);
        }
        return;
      }
      setName(auth.user?.first_name || "");
      setUsername(auth.user?.username ? `@${auth.user.username}` : "");
      setOrgId(auth.orgId);
      try {
        const me = await fetchAuthMe();
        if (cancelled) return;
        setOrgId(me.org_id);
        setRole(me.role === "admin" ? "Admin" : "Operator");
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Profile
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          How you appear inside the workspace and on agent attribution.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}

      <section className="flex items-center gap-5 border-b border-border pb-10">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D6FE5] to-[#0070F3] text-[20px] font-medium text-white">
          {initials}
        </div>
        <div className="space-y-1">
          <div className="text-[15px] font-medium text-text-primary">
            {loading ? "Loading…" : name || "Telegram user"}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {username || "No username"}
          </div>
        </div>
      </section>

      <Field label="Full name" hint="From your Telegram account.">
        <input
          value={name}
          readOnly
          className="w-full rounded-lg border border-border bg-bg-secondary px-3.5 py-2.5 text-[14px] text-text-muted"
        />
      </Field>

      <Field label="Role" hint="Workspace permissions from JWT session.">
        <input
          value={role || (loading ? "Loading…" : "Operator")}
          readOnly
          className="w-full rounded-lg border border-border bg-bg-secondary px-3.5 py-2.5 text-[14px] text-text-muted"
        />
      </Field>

      <Field label="Organization ID" hint="Telegram-linked org scope for all workspace APIs.">
        <input
          value={orgId}
          readOnly
          className="w-full rounded-lg border border-border bg-bg-secondary px-3.5 py-2.5 font-mono text-[13px] text-text-muted"
        />
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          Profile is managed via Telegram login
        </span>
        <button
          type="button"
          disabled
          className="group inline-flex items-center gap-2 rounded-full bg-text-primary/40 px-5 py-2.5 text-[13.5px] font-medium text-bg-elevated"
        >
          <Save size={13} strokeWidth={2.2} />
          Save changes
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
