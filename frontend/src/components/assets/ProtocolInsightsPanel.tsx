import type { ReactNode } from "react";
import { useProtocolStats, useCollateralCatalog } from "@/hooks";
import { isApiConfigured } from "@/lib/api";
import {
  formatUsdFromSnapshotString,
  utilizationPercentFromSnapshotWad,
} from "@/lib/hubFormat";

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

function Shimmer() {
  return <div className="h-8 w-24 animate-pulse rounded bg-surface-container-high" />;
}

/** Merged protocol headline stats (single panel, ~half content width in a two-column layout). */
export function ProtocolInsightsPanel() {
  const { data: protocol, isLoading, isError } = useProtocolStats();
  const { data: catalog, isLoading: catLoading } = useCollateralCatalog();

  const snap = protocol?.latestSnapshot;
  const tvl =
    snap?.totalAssets != null
      ? `$${formatUsdFromSnapshotString(snap.totalAssets)}`
      : "—";
  const nftCount = catalog?.length ?? "—";
  const util = utilizationPercentFromSnapshotWad(snap?.utilizationWad);
  const avgLtv =
    snap?.totalAssets &&
    snap?.totalBorrows &&
    BigInt(snap.totalAssets) > 0n
      ? `${Math.round((Number(BigInt(snap.totalBorrows)) / Number(BigInt(snap.totalAssets))) * 100)}%`
      : util !== undefined
        ? `${Math.round(util)}% util`
        : "—";
  const loans = protocol?.positionCount ?? "—";

  const loading = isLoading || catLoading;

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200/60 bg-white p-6 shadow-slab">
      <h3 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">
        Protocol Insights
      </h3>
      {!isApiConfigured() ? (
        <p className="text-sm text-on-surface-variant">
          Set <code className="text-xs">VITE_API_BASE</code> to load protocol stats.
        </p>
      ) : isError ? (
        <p className="text-sm text-error">Could not load protocol stats.</p>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-4">
          <StatCell label="Total Protocol Value (TVL)">
            {loading ? <Shimmer /> : <p className="font-headline text-2xl font-extrabold text-primary">{tvl}</p>}
          </StatCell>
          <StatCell label="NFT collateral">
            {loading ? <Shimmer /> : <p className="font-headline text-2xl font-extrabold text-secondary">{nftCount}</p>}
          </StatCell>
          <StatCell label="Utilization / borrow vs TVL">
            {loading ? <Shimmer /> : <p className="font-headline text-2xl font-extrabold text-primary">{avgLtv}</p>}
          </StatCell>
          <StatCell label="Open positions">
            {loading ? <Shimmer /> : <p className="font-headline text-2xl font-extrabold text-tertiary-fixed-dim">{loans}</p>}
          </StatCell>
        </div>
      )}
    </div>
  );
}
