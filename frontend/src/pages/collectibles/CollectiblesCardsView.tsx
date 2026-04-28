import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import type { CollectibleCardData } from "@/pages/collectibles/collectiblesMock";

function CollectibleCard({ name, grade, tierIcon, collectionIconSrc, imageSrc, overlays, value }: CollectibleCardData) {
  return (
    <div
      className={cn(
        "group relative rounded-[20px] border border-white/20 bg-black/10 p-3",
        "transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-white/30 hover:bg-black/15 hover:shadow-[-6px_10px_40px_rgba(0,0,0,0.65)]",
        "focus-within:-translate-y-1 focus-within:border-white/30 focus-within:shadow-[-6px_10px_40px_rgba(0,0,0,0.65)]",
        "motion-reduce:transition-none motion-reduce:hover:transform-none",
      )}
    >
      <div className="relative overflow-hidden rounded-[15px]">
        <img
          src={imageSrc}
          alt=""
          className={cn(
            "block aspect-[264/374] w-full rounded-[15px] object-cover",
            "transition-transform duration-500 ease-out",
            "group-hover:scale-[1.03] group-focus-within:scale-[1.03]",
            "motion-reduce:transition-none motion-reduce:transform-none",
          )}
        />
        {overlays?.map((overlay, idx) => {
          const base =
            "absolute top-1 left-1 flex size-8 items-center justify-center rounded-full shadow-[-2px_2px_4px_0_rgba(0,0,0,0.35)]";
          const placement = idx === 0 ? "right-[178px]" : "right-5";
          if (overlay.kind === "pill") {
            return (
              <div key={`${overlay.icon}-${idx}`} className={cn(base, placement, overlay.className)}>
                <BootstrapIcon
                  name={overlay.icon}
                  className="size-[18px]"
                  colorClassName={overlay.className.includes("text-black") ? "bg-black" : "bg-white"}
                />
              </div>
            );
          }
          return (
            <div key={`${overlay.url}-${idx}`} className={cn(base, placement, overlay.className)}>
              <MaskedSvgIcon url={overlay.url} className="size-[18px]" colorClassName="bg-black" />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-3">
        <div >
          <div className="truncate 2xl:text-lg text-base font-normal text-white">{name}</div>
          <div className="flex items-center gap-2">
            <div className="bg-clip-text text-sm font-extrabold uppercase text-transparent bg-[linear-gradient(192deg,#00FF22_10%,#D8FFDD_87%)]">
              {grade}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <BootstrapIcon name={tierIcon} className="size-[14px]" colorClassName="bg-white" />
              <span className="h-4 w-px bg-white/20" />
              <img src={collectionIconSrc} alt="" className="size-4 object-contain opacity-95" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[15px] bg-white/[0.08] px-2 py-1">
          <div className="flex-1 text-sm font-extralight text-white">Value:</div>
          <div className="bg-clip-text text-lg font-extrabold uppercase text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectiblesCardsView({ cards }: { cards: CollectibleCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((c) => (
        <CollectibleCard key={`${c.name}-${c.imageSrc}`} {...c} />
      ))}
    </div>
  );
}

