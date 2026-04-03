import type { ReactNode } from "react";

function StatCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface-container-low/80 p-4 ring-1 ring-zinc-200/40">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      {children}
    </div>
  );
}

/** Merged protocol headline stats (single panel, ~half content width in a two-column layout). */
export function ProtocolInsightsPanel() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200/60 bg-white p-6 shadow-slab">
      <h3 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        Protocol Insights
      </h3>
      <div className="grid flex-1 grid-cols-2 gap-4">
        <StatCell label="Total Protocol Value">
          <p className="font-headline text-2xl font-extrabold text-primary">$24.8M</p>
        </StatCell>
        <StatCell label="Total Assets">
          <p className="font-headline text-2xl font-extrabold text-secondary">12,450</p>
        </StatCell>
        <StatCell label="Avg Protocol LTV">
          <p className="font-headline text-2xl font-extrabold text-primary">52%</p>
        </StatCell>
        <StatCell label="Active Loans">
          <p className="font-headline text-2xl font-extrabold text-tertiary-fixed-dim">3,892</p>
        </StatCell>
      </div>
    </div>
  );
}
