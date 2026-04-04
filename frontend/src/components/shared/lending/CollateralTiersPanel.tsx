import { Icon } from "@/components/ui/Icon";
import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";
import { PROTOCOL_TIER_ROWS } from "@slabfinance/shared";

const TIER_META: Record<
  number,
  { icon: "verified" | "trending_up" | "psychology"; iconBg: string }
> = {
  1: { icon: "verified", iconBg: "bg-primary" },
  2: { icon: "trending_up", iconBg: "bg-secondary" },
  3: { icon: "psychology", iconBg: "bg-primary-container" },
};

export function CollateralTiersPanel() {
  return (
    <div className={`h-full rounded-xl bg-white p-6 ${lendingGhostBorder}`}>
      <h4 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-primary">
        Collateral Tiers
      </h4>
      <div className="space-y-4">
        {PROTOCOL_TIER_ROWS.map((t) => {
          const meta = TIER_META[t.tierId] ?? TIER_META[1];
          return (
            <div
              key={t.tierId}
              className="flex items-center justify-between rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container-high"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${meta.iconBg}`}
                >
                  <Icon name={meta.icon} className="!text-lg" />
                </div>
                <span className="text-sm font-bold text-primary">{t.name}</span>
              </div>
              <span className="text-sm font-extrabold text-secondary">{t.ltvPercent}% LTV</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
