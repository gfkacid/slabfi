import { Icon } from "@/components/ui/Icon";
import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";

const TIERS = [
  {
    name: "Blue Chip",
    ltv: "40% LTV",
    icon: "verified" as const,
    iconBg: "bg-primary",
  },
  {
    name: "Growth",
    ltv: "25% LTV",
    icon: "trending_up" as const,
    iconBg: "bg-secondary",
  },
  {
    name: "Exotic",
    ltv: "15% LTV",
    icon: "psychology" as const,
    iconBg: "bg-primary-container",
  },
];

export function CollateralTiersPanel() {
  return (
    <div className={`h-full rounded-xl bg-white p-6 ${lendingGhostBorder}`}>
      <h4 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-primary">
        Collateral Tiers
      </h4>
      <div className="space-y-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between rounded-lg bg-surface-container-low p-3 transition-colors hover:bg-surface-container-high"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${t.iconBg}`}
              >
                <Icon name={t.icon} className="!text-lg" />
              </div>
              <span className="text-sm font-bold text-primary">{t.name}</span>
            </div>
            <span className="text-sm font-extrabold text-secondary">{t.ltv}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
