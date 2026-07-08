"use client";

import Link from "next/link";
import { Instagram, MessageCircle, Send, Video, Workflow } from "lucide-react";

const channels = [
  { name: "Telegram", icon: Send, note: "Business connection will be wired in Phase B." },
  { name: "Instagram", icon: Instagram, note: "DM and profile connection is coming next." },
  { name: "TikTok", icon: Video, note: "Ad account and organic posting connection placeholder." },
  { name: "WhatsApp", icon: MessageCircle, note: "Inbox routing will live here later." },
  { name: "Website chat", icon: Workflow, note: "Site widget connection placeholder." },
];

export default function ConnectChannelsPage() {
  return (
    <div className="flex h-full flex-col bg-white font-workspace-sans">
      <header className="border-b border-border bg-white px-6 py-6 md:px-10">
        <h1 className="font-workspace-display text-[24px] font-bold tracking-[-0.02em] text-text-primary">
          Connect your channels
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-secondary">
          This is the honest placeholder for Telegram, Instagram, TikTok, WhatsApp, and website chat connections. Real channel auth is Phase B.
        </p>
      </header>
      <main className="flex-1 overflow-y-auto bg-bg-primary px-6 py-8 md:px-10">
        <div className="grid max-w-4xl gap-3">
          {channels.map((channel) => (
            <article key={channel.name} className="flex items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-bg-secondary text-text-secondary">
                <channel.icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-medium text-text-primary">{channel.name}</h2>
                <p className="mt-1 text-[13px] text-text-secondary">{channel.note}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 font-workspace-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Soon
              </span>
            </article>
          ))}
        </div>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-text-primary px-5 py-2.5 text-[13px] font-medium text-bg-elevated">
          Back to dashboard
        </Link>
      </main>
    </div>
  );
}

