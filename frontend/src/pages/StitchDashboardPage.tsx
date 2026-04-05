import { useAccount } from "wagmi";
import { ActiveCollateralSection } from "@/components/slab-dashboard/ActiveCollateralSection";
import { SummaryHeader } from "@/components/slab-dashboard/SummaryHeader";
import { StatsRow } from "@/components/slab-dashboard/StatsRow";
import { LendingPositionCard } from "@/components/slab-dashboard/LendingPositionCard";
import { PortfolioBreakdown } from "@/components/slab-dashboard/PortfolioBreakdown";
import { QuickActionsSection } from "@/components/slab-dashboard/QuickActionsSection";
import { RecentActivitySection } from "@/components/slab-dashboard/RecentActivitySection";

function shortAddress(addr: string) {
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

export function StitchDashboardPage() {
  const { isConnected, address } = useAccount();
  const guest = !isConnected;

  const welcomeLine = guest
    ? "Connect a wallet to view your portfolio, collateral, and activity."
    : address
      ? `Welcome back, ${shortAddress(address)}`
      : "Welcome back";

  return (
    <div className="-mx-6 min-h-full bg-zinc-50 px-6 text-on-surface md:-mx-10 md:px-10">
      <SummaryHeader title="Dashboard" welcomeLine={welcomeLine} />

      <StatsRow guest={guest} />

      <div className="grid grid-cols-12 gap-8">
        {guest ? (
          <div className="col-span-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            <PortfolioBreakdown guest />
            <ActiveCollateralSection guest />
          </div>
        ) : (
          <>
            <div className="col-span-12 space-y-8 lg:col-span-8">
              <PortfolioBreakdown />
              <ActiveCollateralSection />
              <RecentActivitySection />
            </div>
            <aside className="col-span-12 space-y-8 lg:col-span-4">
              <LendingPositionCard />
              <QuickActionsSection />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
