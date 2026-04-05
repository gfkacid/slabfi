import { PanelCard } from "@/components/slab-dashboard/PanelCard";
import { ProgressBar } from "@/components/slab-dashboard/ProgressBar";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";
import { useCollateralCatalog, useProtocolStats, useUserPosition, useOutstandingDebt } from "@/hooks";
import { isApiConfigured } from "@/lib/api";
import { formatUsdNumber, formatUsdc, price8ToUsdNumber } from "@/lib/hubFormat";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { HUB_USDC_DECIMALS } from "@slabfinance/shared";

const FILLS = ["bg-secondary", "bg-yellow-400", "bg-tertiary-fixed-dim", "bg-primary/40", "bg-emerald-400"] as const;

function groupByCollection(
  items: { collection: string; latestPriceUsd?: string | null }[],
): { key: string; label: string; usd: number; pct: number }[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const c of items) {
    const v = price8ToUsdNumber(c.latestPriceUsd ?? undefined);
    if (v <= 0) continue;
    const prev = map.get(c.collection) ?? 0;
    map.set(c.collection, prev + v);
    total += v;
  }
  const rows = [...map.entries()].map(([collection, usd]) => ({
    key: collection,
    label: `${collection.slice(0, 6)}…${collection.slice(-4)}`,
    usd,
    pct: total > 0 ? Math.round((usd / total) * 100) : 0,
  }));
  rows.sort((a, b) => b.usd - a.usd);
  return rows.map((r) => ({ ...r, pct: total > 0 ? Math.round((r.usd / total) * 100) : 0 }));
}

type PortfolioBreakdownProps = { guest?: boolean };

export function PortfolioBreakdown({ guest = false }: PortfolioBreakdownProps) {
  const { data: catalog, isLoading: catalogLoading } = useCollateralCatalog();
  const { data: protocol, isLoading: protocolLoading } = useProtocolStats();
  const position = useUserPosition();
  const { data: debtTuple } = useOutstandingDebt();

  const guestGroups = useMemo(() => groupByCollection(catalog ?? []), [catalog]);

  const loggedInGroups = useMemo(
    () => groupByCollection(position.data?.collaterals ?? []),
    [position.data?.collaterals],
  );

  const totalCollateralUsd = loggedInGroups.reduce((a, r) => a + r.usd, 0);
  const debtWad = debtTuple?.[2];
  const debtUsd =
    debtWad !== undefined && debtWad > 0n ? Number(formatUnits(debtWad, HUB_USDC_DECIMALS)) : 0;
  const totalAssetsDisplay =
    totalCollateralUsd > 0 ? `$${formatUsdNumber(totalCollateralUsd)}` : "—";
  const debtDisplay =
    debtUsd > 0 ? `-$${formatUsdNumber(debtUsd)}` : debtWad === 0n ? "$0.00" : "—";

  if (guest) {
    const loading = isApiConfigured() && (catalogLoading || protocolLoading);
    const showRows = guestGroups.length > 0 ? guestGroups.slice(0, 5) : [];

    return (
      <section>
        <SectionTitle title="Portfolio Breakdown" />
        <PanelCard variant="panel" className="bg-surface-container-low">
          <div className="space-y-6">
            <h3 className="font-headline text-xl font-extrabold tracking-tight text-primary">
              Protocol collateral by collection
            </h3>
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 animate-pulse rounded-xl bg-surface-container-high" />
                <div className="h-12 animate-pulse rounded-xl bg-surface-container-high" />
              </div>
            ) : !isApiConfigured() ? (
              <p className="text-sm text-on-surface-variant">
                Set <code className="text-xs">VITE_API_BASE</code> to load protocol data.
              </p>
            ) : showRows.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No protocol collateral yet.</p>
            ) : (
              <div className="space-y-4">
                {showRows.map((row, i) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/40"
                  >
                    <div>
                      <p className="font-headline text-sm font-bold text-primary">{row.label}</p>
                      <p className="text-xs text-on-surface-variant">{row.pct}% of catalog TVL</p>
                    </div>
                    <p className="font-headline text-sm font-bold text-primary">
                      ${formatUsdNumber(row.usd)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="text-center text-xs text-on-surface-variant">
              Open positions:{" "}
              <span className="font-semibold text-primary">{protocol?.positionCount ?? "—"}</span>
            </p>
          </div>
        </PanelCard>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle title="Portfolio Breakdown" />
      <PanelCard variant="panel">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">Assets by collection</span>
              <span className="text-xs opacity-60">USD Value</span>
            </div>
            {position.isLoading ? (
              <div className="h-32 animate-pulse rounded-xl bg-surface-container-high" />
            ) : loggedInGroups.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No collateral for this wallet yet.</p>
            ) : (
              <div className="space-y-4">
                {loggedInGroups.map((row, i) => (
                  <div key={row.key}>
                    <div className="mb-1.5 flex justify-between text-xs font-medium">
                      <span>{row.label}</span>
                      <span>
                        ${formatUsdNumber(row.usd)} ({row.pct}%)
                      </span>
                    </div>
                    <ProgressBar
                      valuePercent={row.pct}
                      fillClassName={FILLS[i % FILLS.length]}
                      height="md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center border-outline-variant/10 pl-0 md:border-l md:pl-8">
            <div className="text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total collateral
              </p>
              <p className="font-headline text-3xl font-extrabold">{totalAssetsDisplay}</p>
              <p className="mt-2 inline-block rounded bg-error/10 px-2 py-0.5 text-[10px] text-error">
                Debt {debtWad !== undefined ? `$${formatUsdc(debtWad)}` : "—"}
              </p>
            </div>
          </div>
        </div>
      </PanelCard>
    </section>
  );
}
