import { lendingGhostBorder, lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import { useProtocolStats, useUserPosition, useOutstandingDebt, useHealthFactorWad } from "@/hooks";
import { isApiConfigured } from "@/lib/api";
import {
  formatDisplayHealthFactor,
  formatUsd18,
  formatUsdFromSnapshotString,
  formatUsdNumber,
  price8ToUsdNumber,
  utilizationPercentFromSnapshotWad,
} from "@/lib/hubFormat";
import { POSITION_STATUS_LABELS } from "@slabfinance/shared";

function UtilizationBar({ pctNum }: { pctNum: number | undefined }) {
  const pct = pctNum !== undefined && Number.isFinite(pctNum) ? Math.min(100, Math.round(pctNum)) : 0;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant">Global Utilization</span>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LendingSidebar() {
  const { data: protocol, isLoading: protoLoading } = useProtocolStats();
  const position = useUserPosition();
  const liveHf = useHealthFactorWad();
  const { data: debtTuple } = useOutstandingDebt();

  const collaterals = position.data?.collaterals ?? [];
  const lockedUsd = collaterals.reduce(
    (acc, c) => acc + price8ToUsdNumber(c.latestPriceUsd ?? undefined),
    0,
  );
  const borrowed = debtTuple?.[2];
  const borrowedUsd =
    borrowed !== undefined && borrowed > 0n ? formatUsd18(borrowed) : "0.00";

  const hf = formatDisplayHealthFactor(
    liveHf.data,
    Boolean(liveHf.isError),
    position.data?.indexedPosition?.healthFactorWad ?? null,
  );
  const st = position.data?.live?.positionStatus;
  const healthLabel =
    st !== null && st !== undefined ? POSITION_STATUS_LABELS[st] ?? "—" : "—";

  const snap = protocol?.latestSnapshot;
  const tvl =
    snap?.totalAssets != null
      ? `$${formatUsdFromSnapshotString(snap.totalAssets)}`
      : "—";
  const util = utilizationPercentFromSnapshotWad(snap?.utilizationWad);
  const loans = protocol?.positionCount ?? "—";

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
              Collateral value
            </span>
            <p className="font-headline text-2xl font-extrabold">
              {position.isLoading ? "…" : `$${formatUsdNumber(lockedUsd)}`}
            </p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="mb-1 block text-xs font-medium text-primary-fixed-dim">Total Borrowed</span>
              <p className="font-headline text-xl font-bold">${borrowedUsd}</p>
            </div>
            <div className="text-right">
              <span className="mb-1 block text-xs font-medium text-primary-fixed-dim">Health Factor</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {healthLabel} ({hf})
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
          <UtilizationBar pctNum={util} />
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total Value Locked (TVL)
              </span>
              <p className="font-headline text-xl font-extrabold text-primary">
                {protoLoading ? "…" : !isApiConfigured() ? "—" : tvl}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Open positions
              </span>
              <p className="font-headline text-xl font-extrabold text-primary">
                {protoLoading ? "…" : loans}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
