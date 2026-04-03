import { ConnectWalletPrompt } from "@/components/slab-dashboard/ConnectWalletPrompt";
import { SlabButton } from "@/components/slab-dashboard/SlabButton";
import { ProgressBar } from "@/components/slab-dashboard/ProgressBar";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";
import { Icon } from "@/components/ui/Icon";

type StatsRowProps = {
  /** Logged-out / wallet-disconnected dashboard (protocol + connect CTAs). */
  guest?: boolean;
};

export function StatsRow({ guest = false }: StatsRowProps) {
  if (guest) {
    return (
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Protocol metrics">
        <div className={dashboardSurface.statTile}>
          <div className="mb-4 flex items-start justify-between">
            <p className="text-sm font-medium text-on-surface-variant">Protocol TVL</p>
            <span className="rounded bg-tertiary-container px-2 py-0.5 text-xs font-bold text-tertiary-fixed-dim">
              +0.8%
            </span>
          </div>
          <p className="font-headline text-3xl font-extrabold text-primary">$12.4M</p>
          <div className="mt-2">
            <ProgressBar
              valuePercent={75}
              fillClassName="bg-secondary"
              trackClassName="w-full overflow-hidden rounded-full bg-surface-container-high"
              height="sm"
            />
          </div>
        </div>

        <div className={dashboardSurface.statTile}>
          <p className="mb-4 block text-sm font-medium text-on-surface-variant">Market Overview</p>
          <p className="font-headline text-3xl font-extrabold text-primary">72%</p>
          <p className="mt-1 text-sm text-on-surface-variant">USDC Utilization</p>
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
            <p className="font-headline text-3xl font-extrabold text-primary">$842,109.00</p>
            <p className="mt-1 text-sm font-bold text-tertiary-fixed-dim">+12.5% rewards</p>
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
          <h3 className="font-headline text-2xl font-extrabold text-primary">$1,540.20</h3>
          <p className="text-[10px] font-semibold text-tertiary-fixed-dim">+2.4% from yesterday</p>
        </div>
        <div className="rounded-lg border border-zinc-200/60 bg-zinc-50/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className={"text-[9px] font-bold uppercase text-on-surface-variant"}>Outstanding Rewards</p>
              <p className="text-sm font-bold text-slab-accent">{"45.20 SLAB"}</p>
            </div>
            <SlabButton
              variant="claim"
              className={["!w-auto", "shrink-0", "px-3", "py-1.5", "text-[9px]"].join(" ")}
            >
              Claim
            </SlabButton>
          </div>
          <p className={"text-[8px] font-medium text-on-surface-variant/60"}>Accrues every 24h</p>
        </div>
      </div>

      <div className={dashboardSurface.statTile}>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Health Factor
            </p>
            <span className="rounded bg-tertiary-fixed/20 px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-container">
              Healthy
            </span>
          </div>
          <h3 className="font-headline text-2xl font-extrabold text-on-tertiary-container">1.85</h3>
          <div className="mt-2">
            <ProgressBar
              valuePercent={85}
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
            <h4 className="font-headline text-lg font-extrabold text-primary">600.00 USDC</h4>
            <span className="text-[9px] font-medium text-on-surface-variant/60">Arc Testnet</span>
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
            <p className="font-headline text-xl font-extrabold text-primary">
              $12.4M{" "}
              <span className="ml-1 text-xs font-medium text-tertiary-fixed-dim">+0.8%</span>
            </p>
          </div>
          <div className="border-t border-outline-variant/10 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">
              USDC Utilization
            </p>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <ProgressBar
                  valuePercent={72}
                  fillClassName="bg-primary"
                  trackClassName="w-full overflow-hidden rounded-full bg-surface-container-high"
                />
              </div>
              <span className="text-xs font-bold text-primary">72%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
