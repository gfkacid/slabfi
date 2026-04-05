import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { useAccount } from "wagmi";
import { Icon } from "@/components/ui/Icon";
import { useProtocolStats, useUserPosition, useOutstandingDebt, useLendingPoolStats } from "@/hooks";
import {
  aprPercentFromBps,
  aprPercentFromSnapshotBps,
  collateralLatestUsdNumber,
  formatHealthFactorWad,
} from "@/lib/hubFormat";

export function HeaderPortfolioMetrics() {
  const { address, isConnected } = useAccount();
  const { data: protocol } = useProtocolStats();
  const position = useUserPosition();
  const { data: debtTuple } = useOutstandingDebt();
  const poolStats = useLendingPoolStats();

  const collaterals = position.data?.collaterals ?? [];
  const collateralUsd = collaterals.reduce((acc, c) => acc + collateralLatestUsdNumber(c), 0);
  const suppliedUsd =
    poolStats.supplyAssetsUsdc !== undefined
      ? Number(formatUnits(poolStats.supplyAssetsUsdc, HUB_USDC_DECIMALS))
      : 0;
  const debtUsd =
    debtTuple?.[2] !== undefined && debtTuple[2] > 0n
      ? Number(formatUnits(debtTuple[2], HUB_USDC_DECIMALS))
      : 0;
  const netWorthUsd = collateralUsd + suppliedUsd - debtUsd;
  const hasNetWorthInputs = collateralUsd > 0 || suppliedUsd > 0 || debtUsd > 0;
  const netWorthDisplay =
    isConnected && address && hasNetWorthInputs
      ? netWorthUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : isConnected && address
        ? "0.00"
        : "—";

  const snap = protocol?.latestSnapshot;
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
  const netApy =
    isConnected && address
      ? hasShares && hasDebt
        ? `${supplyApr}% / ${borrowApr}%`
        : hasShares
          ? `${supplyApr}%`
          : hasDebt
            ? `${borrowApr}%`
            : supplyApr !== "—"
              ? `${supplyApr}%`
              : "—"
      : "—";

  const hfDisplay = formatHealthFactorWad(position.data?.indexedPosition?.healthFactorWad ?? null);

  return (
    <div
      className="flex min-w-0 flex-1 items-center justify-start gap-5 overflow-x-auto py-1 pr-2 sm:gap-8 md:gap-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      aria-label="Portfolio summary"
    >
      <div className="shrink-0 text-left">
        <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Net worth</p>
        <p className="font-headline text-lg font-extrabold leading-tight text-primary md:text-xl">
          <span className="text-sm font-semibold text-on-surface-variant">$</span>
          {netWorthDisplay}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <div className="flex items-center justify-start gap-0.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Net APY</p>
          <Icon
            name="info"
            className="!text-[14px] text-on-surface-variant"
            title="Supply APR / borrow APR from the latest snapshot or live pool reads."
            aria-hidden
          />
        </div>
        <p className="font-headline text-lg font-extrabold leading-tight text-primary md:text-xl">
          {netApy}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-left">
          <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
            Health factor
          </p>
          <p className="font-headline text-lg font-extrabold leading-tight text-amber-500 md:text-xl">
            {!isConnected || !address ? "—" : hfDisplay}
          </p>
        </div>
        <Link
          to="/lending"
          className="shrink-0 rounded border border-outline-variant/50 bg-surface-container-high px-2.5 py-1.5 font-headline text-[9px] font-bold uppercase tracking-wide text-on-surface transition-colors hover:bg-surface-container"
        >
          Risk details
        </Link>
      </div>
    </div>
  );
}
