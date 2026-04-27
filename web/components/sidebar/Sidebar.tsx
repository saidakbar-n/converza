"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquareText,
  Workflow,
  FolderKanban,
  Package,
  BarChart3,
  CalendarDays,
  Palette,
  KeyRound,
  CreditCard,
  UserRound,
  Brain,
  Cpu,
  ChevronDown,
  Plus,
  X,
  Search,
  PanelLeft,
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

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// IA — three sections + collapsible Settings
// ─────────────────────────────────────────────────────────────────────

const sections: NavSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      { id: "chat", label: "Co-Pilot", href: "/", icon: MessageSquareText, hint: "K" },
      { id: "threads", label: "Agent threads", href: "/threads", icon: Workflow },
      { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
      { id: "products", label: "Products", href: "/products", icon: Package },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [
      { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
      { id: "calendar", label: "Content calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
];

const settingsItems: NavItem[] = [
  { id: "brand", label: "Brand passport", href: "/settings/brand", icon: Palette },
  { id: "tokens", label: "API tokens", href: "/settings/tokens", icon: KeyRound },
  { id: "billing", label: "Billing", href: "/settings/billing", icon: CreditCard },
  { id: "profile", label: "Profile", href: "/settings/profile", icon: UserRound },
  { id: "memory", label: "Agent memory", href: "/settings/memory", icon: Brain },
  { id: "models", label: "Models", href: "/settings/models", icon: Cpu },
];

// Recent threads — placeholder data, would come from store in production
const recentThreads = [
  { id: "t-1", label: "Summer Drop hook test", time: "2h" },
  { id: "t-2", label: "Q3 Dyson launch brief", time: "yesterday" },
  { id: "t-3", label: "UAE market positioning", time: "3d" },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  function SectionHeader({ title }: { title: string }) {
    return (
      <div className="px-3 pb-1.5 pt-1">
        <span className="font-display text-[13px] text-text-muted">
          {title}
        </span>
      </div>
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

      {/* ── Search + new chat ── */}
      <div className="space-y-1.5 px-3 pt-3 pb-2">
        <button className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-muted transition-all duration-150 hover:border-border-hover hover:text-text-primary">
          <Search size={13} strokeWidth={1.8} />
          <span className="flex-1 truncate text-left">Search threads…</span>
          <kbd className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted/80">
            /
          </kbd>
        </button>
        <Link
          href="/"
          onClick={onClose}
          className="group flex items-center gap-2.5 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13.5px] font-medium text-text-primary transition-all duration-150 hover:border-border-hover hover:bg-bg-elevated hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-text-primary text-bg-elevated transition-transform group-hover:scale-105">
            <Plus size={13} strokeWidth={2.4} />
          </span>
          <span>New chat</span>
          <kbd className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
            N
          </kbd>
        </Link>
      </div>

      {/* ── Sectioned nav ── */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="space-y-0.5">
            <SectionHeader title={section.title} />
            {section.items.map((item, idx) => (
              <NavLink key={item.id} item={item} index={sIdx * 4 + idx} />
            ))}
          </div>
        ))}

        {/* Recent threads */}
        <div className="space-y-0.5">
          <SectionHeader title="Recent" />
          {recentThreads.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.04 * (i + 8), ease: [0.16, 1, 0.3, 1] }}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[13px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-text-muted/40 transition-colors group-hover:bg-accent" />
              <span className="flex-1 truncate">{t.label}</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted/70">
                {t.time}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Settings — collapsible */}
        <div className="space-y-0.5">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-bg-hover"
          >
            <span className="font-display flex-1 text-[13px] text-text-muted group-hover:text-text-secondary">
              Settings
            </span>
            <motion.span
              animate={{ rotate: settingsOpen ? 0 : -90 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <ChevronDown
                size={13}
                strokeWidth={2}
                className="text-text-muted"
              />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                {settingsItems.map((item, i) => (
                  <NavLink key={item.id} item={item} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
