"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { MessageSquare, PanelRightOpen, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "@/components/sidebar/Sidebar";
import MasterFeed from "@/components/master-feed/MasterFeed";

interface TheaterOfWorkLayoutProps {
  children: React.ReactNode;
}

/**
 * 3-pane "Theater of Work":
 * 1. Slim nav sidebar (departments)
 * 2. Master Manager Feed (350px, persistent on desktop)
 * 3. Dynamic Artifact Workspace (fluid; drawer on mobile)
 */
export default function TheaterOfWorkLayout({ children }: TheaterOfWorkLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);

  const isHome = pathname === "/";
  const showWorkspaceDrawer = !isHome;

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  function closeWorkspaceDrawer() {
    router.push("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onOpen={() => setNavOpen(true)}
      />

      {/* ── Desktop: panes 2 + 3 (offset for fixed sidebar) ── */}
      <div className="hidden min-h-0 min-w-0 flex-1 md:flex md:pl-[var(--sidebar-width)]">
        <div className="flex h-full w-[var(--master-feed-width)] shrink-0 flex-col overflow-hidden">
          <MasterFeed />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>

      {/* ── Mobile: pane 2 primary; pane 3 = drawer ── */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:hidden">
        <MasterFeed />

        {showWorkspaceDrawer && (
          <button
            type="button"
            onClick={() => setFeedOpen(true)}
            className="fixed bottom-5 left-5 z-30 flex h-11 items-center gap-2 rounded-full bg-bg-elevated px-4 text-[12px] font-medium text-text-primary shadow-lg ring-1 ring-border"
            aria-label="Open Master Feed"
          >
            <MessageSquare size={16} strokeWidth={2} />
            Feed
          </button>
        )}

        <AnimatePresence>
          {showWorkspaceDrawer && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
                aria-label="Close workspace"
                onClick={closeWorkspaceDrawer}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,420px)] flex-col overflow-hidden border-l border-border bg-bg-primary shadow-2xl"
              >
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                    <PanelRightOpen size={12} />
                    Workspace
                  </span>
                  <button
                    type="button"
                    onClick={closeWorkspaceDrawer}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover"
                    aria-label="Close workspace"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">{children}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile home: optional peek at overview */}
        {isHome && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className={clsx(
              "fixed bottom-5 right-5 z-30 flex h-11 items-center gap-2 rounded-full",
              "bg-text-primary px-4 text-[12px] font-medium text-bg-elevated shadow-lg",
            )}
          >
            <PanelRightOpen size={16} strokeWidth={2} />
            Overview
          </button>
        )}
      </div>

      {/* Mobile feed modal (when workspace drawer is open) */}
      <AnimatePresence>
        {feedOpen && showWorkspaceDrawer && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38 }}
            className="fixed inset-0 z-[60] flex flex-col bg-bg-primary md:hidden"
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="text-[14px] font-medium">Master Feed</span>
              <button
                type="button"
                onClick={() => setFeedOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted"
                aria-label="Close feed"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MasterFeed />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
