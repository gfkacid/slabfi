import { Icon } from "@/components/ui/Icon";
import type { LiquidationPromoConfig } from "./liquidationTabMeta";

type LiquidationPromoCardProps = {
  config: LiquidationPromoConfig;
};

export function LiquidationPromoCard({ config }: LiquidationPromoCardProps) {
  return (
    <section className="relative mt-12 flex items-center justify-between overflow-hidden rounded-xl bg-primary p-8 text-on-primary">
      <div className="relative z-10 max-w-lg">
        <h2 className="mb-2 font-headline text-2xl font-bold">{config.title}</h2>
        <p className="font-medium text-zinc-400">{config.description}</p>
        <button
          type="button"
          className="mt-6 rounded-lg bg-secondary px-8 py-3 font-bold text-on-secondary hover:bg-secondary-container"
        >
          {config.ctaLabel}
        </button>
      </div>
      <div className="pointer-events-none absolute -right-12 -top-12 rotate-12 opacity-20">
        <Icon
          name={config.icon}
          className="!text-[240px]"
          style={{
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          }}
        />
      </div>
    </section>
  );
}
