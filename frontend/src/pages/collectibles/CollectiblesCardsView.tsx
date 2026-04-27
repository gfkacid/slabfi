import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import type { CollectibleCardData } from "@/pages/collectibles/collectiblesMock";

function CollectibleCard({ name, grade, tierIcon, collectionIconSrc, imageSrc, overlays, value }: CollectibleCardData) {
  return (
    <div className="relative rounded-[20px] border border-white/20 p-3">
      <div className="relative overflow-hidden rounded-[15px]">
        <img src={imageSrc} alt="" className="block aspect-[264/374] w-full rounded-[15px] object-cover" />
        {overlays?.map((overlay, idx) => {
          const base =
            "absolute top-4 flex size-8 items-center justify-center rounded-full shadow-[-2px_2px_4px_0_rgba(0,0,0,0.35)]";
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
        <div className="space-y-1.5 pb-3">
          <div className="truncate text-[22px] font-normal text-white">{name}</div>
          <div className="flex items-center gap-2">
            <div className="bg-clip-text text-[16px] font-extrabold uppercase text-transparent bg-[linear-gradient(192deg,#00FF22_10%,#D8FFDD_87%)]">
              {grade}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <BootstrapIcon name={tierIcon} className="size-[14px]" colorClassName="bg-white" />
              <span className="h-4 w-px bg-white/20" />
              <img src={collectionIconSrc} alt="" className="size-4 object-contain opacity-95" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-[15px] bg-white/[0.08] px-3 py-2">
          <div className="flex-1 text-[16px] font-extralight text-white">Value:</div>
          <div className="bg-clip-text text-[22px] font-extrabold uppercase text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectiblesCardsView({ cards }: { cards: CollectibleCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => (
        <CollectibleCard key={`${c.name}-${c.imageSrc}`} {...c} />
      ))}
    </div>
  );
}

