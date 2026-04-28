import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import type { AuctionCardData, AuctionStatus } from "@/pages/auctions/auctionsMock";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

function statusTone(status: AuctionStatus) {
  if (status === "Sold") return { pill: "bg-white/10 text-white/70", value: "text-white/70" };
  if (status === "Ending Soon")
    return {
      pill: "text-black bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]",
      value: "bg-clip-text text-transparent bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]",
    };
  return {
    pill: "text-black bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]",
    value: "bg-clip-text text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]",
  };
}

function CountdownPills({ parts }: { parts: readonly [string, string, string, string, string] }) {
  return (
    <div className="flex w-full items-start justify-center gap-1">
      {parts.map((part, idx) => (
        <div
          key={`${part}-${idx}`}
          className="flex flex-1 items-center justify-center overflow-hidden rounded-[9px] bg-white/10 px-1 py-2"
        >
          <span className="text-center text-[16px] font-semibold leading-none text-white">{part}</span>
        </div>
      ))}
    </div>
  );
}

function AuctionCard({
  name,
  grade,
  tierIcon,
  collectionIconSrc,
  imageSrc,
  value,
  highestBid,
  countdownParts,
  status,
}: AuctionCardData) {
  const tone = statusTone(status);
  const isSold = status === "Sold";

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
            isSold && "opacity-80",
          )}
        />

        <div
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full shadow-[-2px_2px_4px_0_rgba(0,0,0,0.35)]"
          style={{ backgroundImage: "linear-gradient(206deg,#00FF22 10%,#D8FFDD 87%)" }}
        >
          <MaskedSvgIcon url={hammerCourt} className="size-[18px]" colorClassName="bg-black" />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-3">
        <div>
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

        <div className="rounded-[15px] bg-white/[0.08] px-2 py-1">
          <div className="flex items-center gap-2 text-white">
            <span className="flex-1 text-sm font-extralight text-white/60">Value:</span>
            <span className="text-lg font-extrabold uppercase text-white">{value}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-white">
            <span className="flex-1 text-sm font-extralight truncate text-white/60">Highest Bid:</span>
            <span className="bg-clip-text text-lg font-extrabold uppercase text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]">
              {highestBid}
            </span>
          </div>
        </div>

        <CountdownPills parts={countdownParts} />
      </div>
    </div>
  );
}

export function AuctionsCardsView({ cards }: { cards: AuctionCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((c) => (
        <AuctionCard key={c.id} {...c} />
      ))}
    </div>
  );
}

