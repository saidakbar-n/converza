"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  Crosshair,
  Radio,
  TrendingUp,
  Kanban,
  Clapperboard,
  Palette,
  Settings,
  X,
  Menu,
  MessageSquare,
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
  emoji: string;
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

const navSections: NavSection[] = [
  {
    id: "command",
    emoji: "🏢",
    title: "Command Center",
    items: [
      { id: "feed", label: "Master Feed", href: "/", icon: MessageSquare, hint: "default" },
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { id: "competitors", label: "Competitor Radar", href: "/competitors", icon: Crosshair },
    ],
  },
  {
    id: "workforce",
    emoji: "👔",
    title: "The Workforce",
    items: [
      { id: "milo", label: "Milo", href: "/workforce/milo", icon: TrendingUp, hint: "Strategy" },
      { id: "sleyz", label: "Sleyz", href: "/workforce/sleyz", icon: Kanban, hint: "Pipeline" },
      { id: "vea", label: "Vea", href: "/workforce/vea", icon: Clapperboard, hint: "Editor" },
    ],
  },
  {
    id: "system",
    emoji: "⚙️",
    title: "System",
    items: [
      { id: "brand", label: "Brand Passport", href: "/settings/brand", icon: Palette },
      { id: "settings", label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose, onOpen }: SidebarProps) {
  const pathname = usePathname();
  const [brandName, setBrandName] = useState("Osman Skincare");

  useEffect(() => {
    function readBrandName() {
      const stored = window.localStorage.getItem(BRAND_NAME_STORAGE_KEY)?.trim();
      setBrandName(stored || "Osman Skincare");
    }
    readBrandName();
    window.addEventListener("storage", readBrandName);
    window.addEventListener("converza:brand-name-updated", readBrandName);
    return () => {
      window.removeEventListener("storage", readBrandName);
      window.removeEventListener("converza:brand-name-updated", readBrandName);
    };
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  }

  function NavLink({ item, index }: { item: NavItem; index: number }) {
    const active = isActive(item.href);
    return (
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24, delay: 0.03 * index, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href={item.href}
          onClick={onClose}
          className={clsx(
            "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
            active
              ? "bg-bg-active font-medium text-text-primary"
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
            size={15}
            strokeWidth={active ? 2.2 : 1.8}
            className={clsx("shrink-0", active ? "text-text-primary" : "text-text-muted")}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.hint && (
            <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-text-muted/80">
              {item.hint}
            </span>
          )}
        </Link>
      </motion.div>
    );
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-3">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-text-primary text-[10px] font-bold text-bg-elevated">
            C
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-[-0.015em]">Converza</span>
            <span className="max-w-[120px] truncate font-mono text-[8px] uppercase tracking-[0.14em] text-text-muted">
              {brandName}
            </span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {navSections.map((section) => (
          <div key={section.id} className="mb-5">
            <div className="mb-1.5 flex items-center gap-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
              <span aria-hidden>{section.emoji}</span>
              <span>{section.title}</span>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item, i) => (
                <NavLink key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-2.5 mb-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-[10px] font-medium text-white">
            NE
            <Radio size={8} className="absolute -bottom-0.5 -right-0.5 text-success" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium">Nodir</p>
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-text-muted">
              CEO · Live
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated ring-1 ring-border md:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} className="text-text-primary" />
      </button>

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
          "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col",
          "border-r border-border bg-bg-secondary transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
