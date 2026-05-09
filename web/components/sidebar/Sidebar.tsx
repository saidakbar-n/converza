"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  UsersRound,
  Crosshair,
  Plug,
  CreditCard,
  ChevronDown,
  X,
  MessageSquareText,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  hint?: string;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// IA — single nav focused on data input for the AI
// ─────────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { id: "brand", label: "Brand Profile", href: "/settings/brand", icon: Sparkles },
  { id: "strategy", label: "Strategy", href: "/strategy", icon: Compass },
  { id: "audience", label: "Target Audience", href: "/audience", icon: UsersRound },
  { id: "competitors", label: "Competitors", href: "/competitors", icon: Crosshair },
  { id: "integrations", label: "Integrations", href: "/integrations", icon: Plug },
  { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function NavLink({ item, index }: { item: NavItem; index: number }) {
    const active = isActive(item.href);
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href={item.href}
          onClick={onClose}
          className={clsx(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors duration-150",
            active
              ? "bg-bg-active text-text-primary font-medium"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
          )}
        >
          {active && (
            <motion.span
              layoutId="active-rail"
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <item.icon
            size={16}
            strokeWidth={active ? 2.2 : 1.8}
            className={clsx(
              "shrink-0 transition-colors",
              active ? "text-text-primary" : "text-text-muted group-hover:text-text-secondary",
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.hint && (
            <kbd className="hidden font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted/70 group-hover:inline">
              {item.hint}
            </kbd>
          )}
        </Link>
      </motion.div>
    );
  }

  const sidebarContent = (
    <>
      {/* ── Workspace switcher (Claude / Linear style) ── */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <button className="group flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-bg-hover">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-text-primary text-bg-elevated">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5v11M1.5 7h11M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg-secondary" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[13.5px] font-semibold tracking-[-0.015em] text-text-primary">
              Converza
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
              Osman Skincare
            </span>
          </span>
          <ChevronDown
            size={13}
            strokeWidth={2}
            className="ml-1 text-text-muted transition-transform group-hover:translate-y-0.5"
          />
        </button>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Single flat nav, focused on data input for the AI ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-4">
        {navItems.map((item, i) => (
          <NavLink key={item.id} item={item} index={i} />
        ))}

        {/* Quiet shortcut to the chat assistant — kept reachable but out of the primary IA */}
        <div className="mt-6 border-t border-border/60 pt-3">
          <Link
            href="/copilot"
            onClick={onClose}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
          >
            <MessageSquareText size={14} strokeWidth={1.8} />
            <span className="flex-1">Co-Pilot chat</span>
            <kbd className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted/70">
              ↗
            </kbd>
          </Link>
        </div>
      </nav>

      {/* ── User chip ── */}
      <div className="mx-3 mb-3">
        <Link
          href="/settings/profile"
          onClick={onClose}
          className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-bg-hover"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D6FE5] to-[#0070F3] text-[11px] font-medium text-white">
            NE
          </span>
          <span className="flex-1 truncate text-[13px] font-medium text-text-primary">
            Nodir
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            Free
          </span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 hidden w-[var(--sidebar-width)] flex-col",
          "border-r border-border bg-bg-secondary md:flex",
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col",
          "border-r border-border bg-bg-secondary",
          "transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
