import { ConnectWalletPrompt } from "@/components/slab-dashboard/ConnectWalletPrompt";
import { SlabButton } from "@/components/slab-dashboard/SlabButton";
import { ProgressBar } from "@/components/slab-dashboard/ProgressBar";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";
import { Icon } from "@/components/ui/Icon";
import {
  useProtocolStats,
  useUserPosition,
  useOutstandingDebt,
  useLendingPoolStats,
} from "@/hooks";
import { formatUnits } from "viem";
import { HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { hubChain } from "@/lib/hub";
import {
  aprPercentFromBps,
  aprPercentFromSnapshotBps,
  formatHealthFactorWad,
  formatUsdc,
  formatUsdFromSnapshotString,
  healthFactorBarPercent,
  utilizationPercentFromSnapshotWad,
  utilizationPercentFromWad,
  price8ToUsdNumber,
} from "@/lib/hubFormat";
import { isApiConfigured } from "@/lib/api";
import { POSITION_STATUS_LABELS } from "@slabfinance/shared";

type StatsRowProps = {
  /** Logged-out / wallet-disconnected dashboard (protocol + connect CTAs). */
  guest?: boolean;
};

function ShimmerStat() {
  return (
    <div className="h-8 w-28 max-w-full animate-pulse rounded-lg bg-surface-container-high" />
  );
}

export function StatsRow({ guest = false }: StatsRowProps) {
  const { data: protocol, isLoading: protocolLoading, isError: protocolError } = useProtocolStats();
  const poolStats = useLendingPoolStats();
  const position = useUserPosition();
  const { data: debtTuple } = useOutstandingDebt();

  const snap = protocol?.latestSnapshot;
  const tvlStr = snap?.totalAssets
    ? `$${formatUsdFromSnapshotString(snap.totalAssets)}`
    : poolStats.totalAssets !== undefined
      ? `$${formatUsdc(poolStats.totalAssets)}`
      : "—";
  const utilPct =
    utilizationPercentFromSnapshotWad(snap?.utilizationWad) ??
    utilizationPercentFromWad(poolStats.utilizationWad);
  const utilDisplay =
    utilPct !== undefined && Number.isFinite(utilPct) ? `${Math.round(utilPct)}%` : "—";

  const collaterals = position.data?.collaterals ?? [];
  const collateralUsd = collaterals.reduce(
    (acc, c) => acc + price8ToUsdNumber(c.latestPriceUsd ?? undefined),
    0,
  );
  const debtWad = position.onHub ? (debtTuple?.[2] ?? 0n) : undefined;
  const debtUsd =
    debtWad !== undefined && debtWad > 0n ? Number(formatUnits(debtWad, HUB_USDC_DECIMALS)) : 0;
  const netWorthUsd = collateralUsd - debtUsd;
  const netWorthDisplay =
    Number.isFinite(netWorthUsd) && (collateralUsd > 0 || debtUsd > 0)
      ? `$${netWorthUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : collateralUsd > 0
        ? `$${collateralUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : debtUsd > 0
          ? `-$${debtUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "—";

  const hfStr = position.data?.indexedPosition?.healthFactorWad ?? undefined;
  const hfDisplay = formatHealthFactorWad(hfStr ?? null);
  const statusIdx = position.data?.live?.positionStatus;
  const healthLabel =
    statusIdx !== null && statusIdx !== undefined
      ? POSITION_STATUS_LABELS[statusIdx] ?? "—"
      : "—";
  const hfBar = healthFactorBarPercent(hfStr);

  const supplyApr =
    snap?.supplyAprBps !== undefined
      ? aprPercentFromSnapshotBps(snap.supplyAprBps)
      : aprPercentFromBps(poolStats.supplyAprBps);
  const borrowApr =
    snap?.borrowAprBps !== undefined
      ? aprPercentFromSnapshotBps(snap.borrowAprBps)
      : aprPercentFromBps(poolStats.borrowAprBps);
  const hasShares = poolStats.balanceOfShares !== undefined && poolStats.balanceOfShares > 0n;
  const hasDebt = debtTuple !== undefined && debtTuple[2] > 0n;
  const blendedApy =
    hasShares && hasDebt
      ? `${supplyApr}% / ${borrowApr}%`
      : hasShares
        ? `${supplyApr}%`
        : hasDebt
          ? `${borrowApr}%`
          : supplyApr !== "—"
            ? `${supplyApr}%`
            : "—";

  const borrowedDisplay =
    debtTuple?.[2] !== undefined && debtTuple[2] > 0n
      ? `${formatUsdc(debtTuple[2])} USDC`
      : "0.00 USDC";

  const guestLoading = guest && isApiConfigured() && protocolLoading;

  if (guest) {
    return (
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Protocol metrics">
        <div className={dashboardSurface.statTile}>
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-medium text-on-surface-variant">Protocol TVL</p>
          </div>
          {guestLoading ? (
            <ShimmerStat />
          ) : protocolError || !isApiConfigured() ? (
            <p className="font-headline text-3xl font-extrabold text-primary">—</p>
          ) : (
            <p className="font-headline text-3xl font-extrabold text-primary">{tvlStr}</p>
          )}
          <div className="mt-2">
            <ProgressBar
              valuePercent={utilPct !== undefined ? Math.min(100, Math.round(utilPct)) : 0}
              fillClassName="bg-secondary"
              trackClassName="w-full overflow-hidden rounded-full bg-surface-container-high"
              height="sm"
            />
          </div>
        </div>

        <div className={dashboardSurface.statTile}>
          <p className="mb-4 block text-sm font-medium text-on-surface-variant">Market Overview</p>
          {guestLoading ? (
            <ShimmerStat />
          ) : (
            <>
              <p className="font-headline text-3xl font-extrabold text-primary">{utilDisplay}</p>
              <p className="mt-1 text-sm text-on-surface-variant">USDC Utilization</p>
            </>
          )}
          <div className="mt-4 flex gap-1">
            <div className="h-2 flex-1 rounded-sm bg-secondary" />
            <div className="h-2 flex-1 rounded-sm bg-secondary/60" />
            <div className="h-2 flex-1 rounded-sm bg-secondary/30" />
            <div className="h-2 flex-1 rounded-sm bg-surface-container-high" />
          </div>
        </div>

        <div className={`relative overflow-hidden ${dashboardSurface.statTile}`}>
          <div className="pointer-events-none select-none blur-sm" aria-hidden>
            <p className="mb-4 text-sm font-medium text-on-surface-variant">Net Worth &amp; Rewards</p>
            <p className="font-headline text-3xl font-extrabold text-primary">—</p>
            <p className="mt-1 text-sm font-bold text-tertiary-fixed-dim">Rewards coming soon</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
            <p className="mb-3 text-sm font-headline font-bold text-primary">Connect Wallet to View</p>
            <ConnectWalletPrompt size="sm" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Key metrics">
      <div className={dashboardSurface.statTile}>
        <div className="mb-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Net Worth
          </p>
          {position.isLoading ? (
            <ShimmerStat />
          ) : (
            <h3 className="font-headline text-2xl font-extrabold text-primary">{netWorthDisplay}</h3>
          )}
          <p className="text-[10px] font-semibold text-on-surface-variant">Collateral value − debt (indexed)</p>
        </div>
        <div className="rounded-lg border border-zinc-200/60 bg-zinc-50/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className={"text-[9px] font-bold uppercase text-on-surface-variant"}>Rewards</p>
              <p className="text-sm font-bold text-on-surface-variant">Coming soon</p>
            </div>
            <SlabButton variant="claim" disabled className={["!w-auto", "shrink-0", "px-3", "py-1.5", "text-[9px]"].join(" ")}>
              Claim
            </SlabButton>
          </div>
          <p className={"text-[8px] font-medium text-on-surface-variant/60"}>SLAB accrual not live on testnet</p>
        </div>
      </div>

      <div className={dashboardSurface.statTile}>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Health Factor
            </p>
            <span className="rounded bg-tertiary-fixed/20 px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-container">
              {healthLabel}
            </span>
          </div>
          {position.isLoading ? (
            <ShimmerStat />
          ) : (
            <h3 className="font-headline text-2xl font-extrabold text-on-tertiary-container">{hfDisplay}</h3>
          )}
          <div className="mt-2">
            <ProgressBar
              valuePercent={hfBar}
              fillClassName="bg-tertiary-fixed-dim"
              trackClassName="w-full overflow-hidden rounded-full bg-surface-container-high"
            />
          </div>
        </div>
        <div className="mt-4 border-t border-outline-variant/10 pt-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Total Borrowed
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="font-headline text-lg font-extrabold text-primary">{borrowedDisplay}</h4>
            <span className="text-[9px] font-medium text-on-surface-variant/60">{hubChain.name}</span>
          </div>
        </div>
      </div>

      <div className={dashboardSurface.statTile}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Market Overview
          </p>
          <Icon name="monitoring" className="text-sm text-on-surface-variant" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">TVL</p>
            <p className="font-headline text-xl font-extrabold text-primary">{tvlStr}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">
              Blended APR (supply / borrow)
            </p>
            <p className="font-headline text-lg font-extrabold text-primary">{blendedApy}</p>
          </div>
          <div className="border-t border-outline-variant/10 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">
              USDC Utilization
            </p>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ProgressBar
                  valuePercent={utilPct !== undefined ? Math.min(100, Math.round(utilPct)) : 0}
                  fillClassName="bg-primary"
                  trackClassName="w-full overflow-hidden rounded-full bg-surface-container-high"
                />
              </div>
              <span className="text-xs font-bold text-primary">{utilDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
