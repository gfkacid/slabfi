import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";
import type { LiquidationStatItem } from "./liquidationTabMeta";

type LiquidationStatGridProps = {
  items: readonly LiquidationStatItem[];
};

export function LiquidationStatGrid({ items }: LiquidationStatGridProps) {
  return (
    <section
      className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3"
      aria-label="Liquidation metrics"
    >
      {items.map((item) => (
        <div key={item.label} className={dashboardSurface.statTile}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            {item.label}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-headline text-3xl font-extrabold tracking-tight text-primary">
              {item.value}
            </span>
            {item.hint ? (
              <span className={item.hintClassName ?? "text-sm text-on-surface-variant"}>
                {item.hint}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  );
}
