import { Icon } from "@/components/ui/Icon";

type CollateralImageFillProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

/** Renders indexed artwork or a neutral placeholder (no remote mock images). */
export function CollateralImageFill({ src, alt, className = "" }: CollateralImageFillProps) {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-surface-container-high ${className}`.trim()}
      role="img"
      aria-label={alt ? `${alt} (no image)` : "No artwork"}
    >
      <Icon name="inventory_2" className="!text-5xl text-on-surface-variant/35" aria-hidden />
    </div>
  );
}
