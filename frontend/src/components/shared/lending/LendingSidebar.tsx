import { lendingGhostBorder, lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";

function UtilizationBar({ pct }: { pct: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant">Global Utilization</span>
        <span className="text-xs font-bold text-primary">{pct}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-secondary" style={{ width: pct }} />
      </div>
    </div>
  );
}

export function LendingSidebar() {
  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-xl ${lendingGradientPrimary}`}>
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />
        <h4 className="mb-6 font-headline text-sm font-bold uppercase tracking-widest text-primary-fixed">
          My Position
        </h4>
        <div className="space-y-6">
          <div>
            <span className="mb-1 block text-xs font-medium text-primary-fixed-dim">
              Locked Collateral Value
            </span>
            <p className="font-headline text-2xl font-extrabold">$142,500.00</p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="mb-1 block text-xs font-medium text-primary-fixed-dim">Total Borrowed</span>
              <p className="font-headline text-xl font-bold">$35,000.00</p>
            </div>
            <div className="text-right">
              <span className="mb-1 block text-xs font-medium text-primary-fixed-dim">Health Factor</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Healthy (2.41)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl bg-white p-6 ${lendingGhostBorder}`}>
        <h4 className="mb-6 font-headline text-sm font-bold uppercase tracking-widest text-primary">
          Protocol Metrics
        </h4>
        <div className="space-y-8">
          <UtilizationBar pct="68.4%" />
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total Value Locked (TVL)
              </span>
              <p className="font-headline text-xl font-extrabold text-primary">$428.14M</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Active Loans
              </span>
              <p className="font-headline text-xl font-extrabold text-primary">1,422</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
