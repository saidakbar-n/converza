"use client";

interface WorkspaceShellProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

/** Right-pane chrome for the Artifact Workspace (pane 3). */
export default function WorkspaceShell({
  title,
  subtitle,
  badge,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-5 md:px-8">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[17px] font-medium tracking-[-0.01em] text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <span className="hidden text-[13px] text-text-muted sm:block">
              {subtitle}
            </span>
          )}
        </div>
        {badge}
      </header>
      <div className="flex-1 overflow-y-auto bg-bg-primary">{children}</div>
    </div>
  );
}
