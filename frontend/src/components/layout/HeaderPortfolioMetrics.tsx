import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

/** Placeholder metrics — replace with live data when portfolio APIs are wired. */
const MOCK = {
  netWorth: "969.90",
  netApyPercent: "0.50",
  healthFactor: "1.96",
} as const;

export function HeaderPortfolioMetrics() {
  return (
    <div
      className="flex min-w-0 flex-1 items-center justify-start gap-5 overflow-x-auto py-1 pr-2 sm:gap-8 md:gap-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      aria-label="Portfolio summary"
    >
      <div className="shrink-0 text-left">
        <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Net worth</p>
        <p className="font-headline text-lg font-extrabold leading-tight text-primary md:text-xl">
          <span className="text-sm font-semibold text-on-surface-variant">$</span>
          {MOCK.netWorth}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <div className="flex items-center justify-start gap-0.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Net APY</p>
          <Icon
            name="info"
            className="!text-[14px] text-on-surface-variant"
            title="Blended annualized yield across your supplied and borrowed positions."
            aria-hidden
          />
        </div>
        <p className="font-headline text-lg font-extrabold leading-tight text-primary md:text-xl">
          {MOCK.netApyPercent}%
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-left">
          <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
            Health factor
          </p>
          <p className="font-headline text-lg font-extrabold leading-tight text-amber-500 md:text-xl">
            {MOCK.healthFactor}
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
