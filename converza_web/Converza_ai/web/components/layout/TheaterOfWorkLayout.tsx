"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MessageSquare, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "@/components/sidebar/Sidebar";
import MasterFeed from "@/components/master-feed/MasterFeed";
import OrgSetupBanner from "@/components/auth/OrgSetupBanner";

interface TheaterOfWorkLayoutProps {
  children: React.ReactNode;
}

/**
 * 3-pane "Theater of Work":
 * 1. Slim nav sidebar (departments)
 * 2. Dynamic Artifact Workspace (fluid center)
 * 3. Master Manager Feed (350px, persistent on desktop right)
 */
export default function TheaterOfWorkLayout({ children }: TheaterOfWorkLayoutProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onOpen={() => setNavOpen(true)}
      />

      {/* ── Desktop: workspace center + feed right ── */}
      <div className="hidden min-h-0 min-w-0 flex-1 md:flex md:pl-[var(--sidebar-width)]">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <OrgSetupBanner />
          {children}
        </main>
        <div className="flex h-full w-[var(--master-feed-width)] shrink-0 flex-col overflow-hidden">
          <MasterFeed />
        </div>
      </div>

      {/* ── Mobile: workspace primary; feed = right sheet ── */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:hidden">
        <OrgSetupBanner />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>

        <button
          type="button"
          onClick={() => setFeedOpen(true)}
          className={clsx(
            "fixed bottom-5 right-5 z-30 flex h-11 items-center gap-2 rounded-full",
            "bg-text-primary px-4 text-[12px] font-medium text-bg-elevated shadow-lg",
          )}
          aria-label="Open Master Feed"
        >
          <MessageSquare size={16} strokeWidth={2} />
          Feed
        </button>

        <AnimatePresence>
          {feedOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
                aria-label="Close Master Feed"
                onClick={() => setFeedOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,var(--master-feed-width))] flex-col overflow-hidden border-l border-border bg-bg-primary shadow-2xl"
              >
                <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
                  <span className="text-[14px] font-medium">Master Feed</span>
                  <button
                    type="button"
                    onClick={() => setFeedOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-hover"
                    aria-label="Close feed"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MasterFeed />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
