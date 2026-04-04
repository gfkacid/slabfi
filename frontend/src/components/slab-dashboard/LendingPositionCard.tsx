import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useUserPosition, useOutstandingDebt, useLendingPoolStats } from "@/hooks";
import { hubChain } from "@/lib/hub";
import { aprPercentFromBps, formatUsd18, formatUsdNumber, price8ToUsdNumber } from "@/lib/hubFormat";

const LTV_MAX_PCT = 60;

export function LendingPositionCard() {
  const position = useUserPosition();
  const { data: debtTuple } = useOutstandingDebt();
  const poolStats = useLendingPoolStats();

  const collaterals = position.data?.collaterals ?? [];
  const collateralUsd = collaterals.reduce(
    (acc, c) => acc + price8ToUsdNumber(c.latestPriceUsd ?? undefined),
    0,
  );
  const principal = debtTuple?.[0];
  const interest = debtTuple?.[1];
  const totalDebt = debtTuple?.[2];
  const debtUsd = totalDebt !== undefined && totalDebt > 0n ? Number(totalDebt) / 1e18 : 0;

  const ltvPct =
    collateralUsd > 0 && debtUsd > 0
      ? Math.min(999, Math.round((debtUsd / collateralUsd) * 100))
      : 0;
  const ltvBarWidthPct = Math.min(100, LTV_MAX_PCT > 0 ? (ltvPct / LTV_MAX_PCT) * 100 : 0);

  const borrowApr = aprPercentFromBps(poolStats.borrowAprBps);
  const interestUsd =
    interest !== undefined && interest > 0n ? formatUsd18(interest) : "0.00";

  return (
    <section>
      <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">Lending Position</h2>
      <div className="group relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-xl">
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-secondary opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
        <div className="relative mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
              {hubChain.name}
            </p>
            <h4 className="font-headline text-2xl font-extrabold tracking-tight">USDC Loan</h4>
          </div>
          <Icon name="account_balance" className="text-secondary-fixed-dim" />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <p className="text-sm font-medium opacity-70">Borrow APR / interest</p>
            <div className="text-right">
              <p className="text-lg font-bold">{borrowApr}% APR</p>
              <p className="text-[10px] text-tertiary-fixed-dim">
                +${interestUsd} interest accrued
              </p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium opacity-70">Current LTV</p>
              <p className="text-sm font-bold">
                {position.isLoading ? "…" : `${ltvPct}%`}{" "}
                <span className="text-[10px] font-medium opacity-40">/ {LTV_MAX_PCT}% max</span>
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-secondary-fixed-dim shadow-[0_0_8px_rgba(173,198,255,0.5)]"
                style={{ width: `${ltvBarWidthPct}%` }}
              />
            </div>
          </div>
          {principal !== undefined && totalDebt !== undefined ? (
            <p className="text-xs opacity-80">
              Principal ${formatUsd18(principal)} · Total debt ${formatUsd18(totalDebt)}
              {collateralUsd > 0 ? ` · Collateral ~$${formatUsdNumber(collateralUsd)}` : ""}
            </p>
          ) : null}
        </div>
        <Link
          to="/lending?tab=repay"
          className="mt-6 block w-full rounded-xl bg-secondary-container py-3 text-center font-bold text-white hover:bg-secondary"
        >
          Manage Loan
        </Link>
      </div>
    </section>
  );
}
