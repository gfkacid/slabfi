import { lendingGhostBorder } from "@/components/shared/lending/lendingStyles";

type TierCollateralCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  tierLabel: string;
  tierBadgeClassName: string;
  ltv: string;
  layout: "compact" | "featured";
  subtitle?: string;
  valuation?: string;
};

export function TierCollateralCard({
  imageSrc,
  imageAlt,
  title,
  tierLabel,
  tierBadgeClassName,
  ltv,
  layout,
  subtitle,
  valuation,
}: TierCollateralCardProps) {
  const mediaClass =
    layout === "compact"
      ? "relative mb-4 h-48 overflow-hidden rounded-lg bg-surface-container-high"
      : "relative mb-4 aspect-[4/5] overflow-hidden rounded-lg bg-surface-container-high";

  return (
    <div
      className={`group overflow-hidden rounded-xl bg-white p-4 transition-all ${lendingGhostBorder} ${
        layout === "featured" ? "p-5 hover:shadow-lg" : ""
      }`.trim()}
    >
      <div className={mediaClass}>
        <img
          alt={imageAlt}
          src={imageSrc}
          className={`h-full w-full object-contain object-center ${
            layout === "compact"
              ? "transition-transform duration-500 group-hover:scale-105"
              : "transition-transform duration-700 group-hover:scale-110"
          }`}
        />
        <div
          className={`absolute font-bold text-white ${layout === "compact" ? "right-2 top-2 rounded-md px-2 py-1 text-[10px]" : "right-3 top-3 rounded-md px-3 py-1 text-[10px] uppercase tracking-widest"} ${tierBadgeClassName}`.trim()}
        >
          {tierLabel}
        </div>
      </div>
      {layout === "compact" ? (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{title}</span>
          <span className="text-xs font-bold text-secondary">{ltv}</span>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="block text-base font-bold text-primary">{title}</span>
            {subtitle ? <span className="text-xs text-on-surface-variant">{subtitle}</span> : null}
          </div>
          <div className="text-right">
            <span className="block text-sm font-extrabold text-secondary">{ltv}</span>
            {valuation ? (
              <span className="block text-[10px] font-bold uppercase text-on-primary-container">
                {valuation}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
