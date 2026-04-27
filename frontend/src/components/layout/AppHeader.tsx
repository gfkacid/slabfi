import { AppKitButton } from "@reown/appkit/react";
import { useLocation } from "react-router-dom";
import { HEADER_HEIGHT_CLASS } from "@/components/layout/shellConstants";
import { HeaderPortfolioMetrics } from "@/components/layout/HeaderPortfolioMetrics";
import { BootstrapIcon, type BootstrapIconName } from "@/components/ui/BootstrapIcon";
import { cn } from "@/lib/utils";

const demoMode = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

type CollectiblesTopStat = {
  label: string;
  value: string;
  icon: BootstrapIconName;
  valueGradientClass: string;
  valueSuffix?: { text: string; className?: string };
};

const COLLECTIBLES_TOP_STATS: CollectiblesTopStat[] = [
  {
    label: "Net Worth",
    value: "$470.80",
    icon: "wallet2",
    valueGradientClass: "bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]",
  },
  {
    label: "Net APY",
    value: "3.96%",
    icon: "graph-up-arrow",
    valueGradientClass: "bg-[linear-gradient(191deg,#00FF22_10%,#D8FFDD_87%)]",
  },
  {
    label: "Health Factor",
    value: "2.9",
    icon: "heart",
    valueGradientClass: "bg-[linear-gradient(191deg,#00FF22_10%,#D8FFDD_87%)]",
    valueSuffix: { text: "Safe", className: "text-[12px]" },
  },
];

function TopStatPill({ label, value, icon, valueGradientClass, valueSuffix }: CollectiblesTopStat) {
  return (
    <div className="flex items-center gap-3 rounded-[100px] bg-white/10 px-2 py-1.5 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
      <div className="flex size-12 items-center justify-center rounded-full bg-black">
        <BootstrapIcon name={icon} className="size-[23px]" colorClassName="bg-white" />
      </div>
      <div className="flex flex-col justify-center gap-1 pr-3">
        <div className="flex items-center gap-2 text-[14px] font-extralight text-white">
          <span>{label}</span>
          <BootstrapIcon name="info-circle" className="size-[14px] opacity-50" colorClassName="bg-white" />
        </div>
        <div className={cn("bg-clip-text text-[18px] font-medium uppercase text-transparent", valueGradientClass)}>
          <span>{value} </span>
          {valueSuffix ? <span className={cn("font-medium", valueSuffix.className)}>{valueSuffix.text}</span> : null}
        </div>
      </div>
    </div>
  );
}

function WalletPill() {
  return (
    <div className="flex items-center gap-3 rounded-[100px] bg-white/10 px-2 py-1.5 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
      <div className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]">
        <BootstrapIcon name="globe2" className="size-[24px]" colorClassName="bg-black" />
      </div>
      <div className="flex flex-col justify-center gap-1 pr-3">
        <div className="text-[14px] font-extralight text-white">BWAy..apsG</div>
        <div className="bg-clip-text text-[18px] font-medium uppercase text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]">
          120.00 USDC
        </div>
      </div>
    </div>
  );
}

export function AppHeader() {
  const { pathname } = useLocation();
  const isCollectibles = pathname === "/collectibles";

  return (
    <header
      className={`sticky top-0 z-50 flex ${HEADER_HEIGHT_CLASS} items-center justify-between gap-3 border-b border-outline-variant/10 bg-surface/80 px-10 shadow-sm backdrop-blur-xl`}
    >
      {demoMode ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex shrink-0 rounded-full border border-outline-variant/15  px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-primary/70">
            Demo mode
          </span>
          <span className="truncate text-xs text-text-primary/60">
            Wallet + live protocol reads disabled.
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto py-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isCollectibles ? (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {COLLECTIBLES_TOP_STATS.map((s) => (
                <TopStatPill key={s.label} {...s} />
              ))}
            </div>
          ) : (
            <HeaderPortfolioMetrics />
          )}
        </div>
      )}
      {!demoMode && (
        <div className="relative z-10 flex shrink-0 items-center gap-3">
          {isCollectibles ? <WalletPill /> : null}
          <AppKitButton />
        </div>
      )}
    </header>
  );
}
