import { Icon } from "@/components/ui/Icon";

export type CatalogAssetHealth = "healthy" | "warning";

export type ProtocolCatalogAssetCardProps = {
  imageUrl: string;
  imageAlt: string;
  assetId: string;
  title: string;
  subtitle: string;
  valuation: string;
  ltvPercent: number;
  health: CatalogAssetHealth;
  /** User-owned collateral — shows star + Mine badge */
  isMine?: boolean;
  /** Withdraw action (only rendered when `isMine` is true). */
  onWithdraw?: () => void;
};

const healthLabel: Record<CatalogAssetHealth, string> = {
  healthy: "HEALTHY",
  warning: "WARNING",
};

const healthClass: Record<CatalogAssetHealth, string> = {
  healthy: "bg-tertiary-fixed text-on-tertiary-container",
  warning: "bg-error-container text-error",
};

const starFilled = { fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" } as const;

export function ProtocolCatalogAssetCard({
  imageUrl,
  imageAlt,
  assetId,
  title,
  subtitle,
  valuation,
  ltvPercent,
  health,
  isMine = false,
  onWithdraw,
}: ProtocolCatalogAssetCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isMine ? (
          <div
            className="absolute right-2.5 top-2.5 z-[1] inline-flex items-center gap-0.5 rounded-full border border-amber-600/35 bg-yellow-300 px-1.5 py-0.5 text-amber-950 shadow-sm backdrop-blur-sm"
            title="Your asset"
          >
            <Icon
              name="star"
              className="!text-[12px] !leading-none text-amber-950"
              style={starFilled}
              aria-hidden
            />
            <span className="font-headline text-[9px] font-extrabold uppercase tracking-wide text-amber-950">
              Mine
            </span>
          </div>
        ) : null}
        <div className="absolute left-2.5 top-2.5 z-[1] flex h-7 min-w-7 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 px-2 shadow-sm backdrop-blur-md">
          <span className="font-headline text-[10px] font-extrabold tabular-nums leading-none text-primary">
            #{assetId}
          </span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-white/20 bg-surface-container-lowest/20 p-2.5 backdrop-blur-xl">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-tighter text-white opacity-80">
                LTV Ratio
              </p>
              <p className="text-base font-extrabold leading-tight text-white">{ltvPercent}%</p>
            </div>
            <div className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${healthClass[health]}`}>
              {healthLabel[health]}
            </div>
          </div>
        </div>
      </div>
      <div className="p-3.5 sm:p-4">
        <h3 className="mb-0.5 truncate font-headline text-sm font-bold text-primary sm:text-base">
          {title}
        </h3>
        <p className="mb-3 line-clamp-2 text-[11px] leading-snug text-on-surface-variant">{subtitle}</p>
        <div className="flex items-center justify-between gap-2 border-t border-outline-variant/10 py-2.5">
          <span className="shrink-0 text-xs font-medium text-on-surface-variant">Valuation</span>
          <span className="truncate text-right font-headline text-lg font-extrabold text-primary sm:text-xl">
            {valuation}
          </span>
        </div>
        {isMine && onWithdraw ? (
          <div className="border-t border-outline-variant/10 pt-3">
            <button
              type="button"
              onClick={onWithdraw}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200/80 bg-surface-container-low py-2.5 font-headline text-xs font-bold text-primary transition-all hover:border-secondary/40 hover:bg-secondary-fixed/20 active:scale-[0.98]"
            >
              <Icon name="south_west" className="!text-base text-secondary" aria-hidden />
              Withdraw
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
