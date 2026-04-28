import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import type { AuctionCardData, AuctionStatus } from "@/pages/auctions/auctionsMock";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

function statusTone(status: AuctionStatus) {
  if (status === "Sold")
    return {
      label: "text-white/70",
      bar: "bg-white/20",
      pill: "bg-white/10 text-white/70",
    };
  if (status === "Ending Soon")
    return {
      label: "bg-clip-text text-transparent bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]",
      bar: "bg-[linear-gradient(184deg,#FF7300_10%,#FFD0A4_87%)]",
      pill: "text-black bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]",
      ends: "text-[#FF7300]",
    };
  return {
    label: "bg-clip-text text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]",
    bar: "bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)]",
    pill: "text-black bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]",
    ends: "text-white/80",
  };
}

function AuctionListItem({ row }: { row: AuctionCardData }) {
  const isSold = row.status === "Sold";

  return (
    <div className="flex flex-col gap-4 rounded-[15px] bg-white/10 px-3 py-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)] lg:flex-row lg:items-center lg:gap-8 lg:px-3 lg:py-3 lg:pl-3 lg:pr-6">
      <div className="flex min-w-0 flex-1 items-center gap-[18px]">
        <div className="h-[91px] w-[64px] shrink-0 overflow-hidden rounded-[10px]">
          <img src={row.imageSrc} alt="" className={cn("h-full w-full object-cover", isSold && "opacity-80")} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="min-w-0 space-y-1.5">
            <div className="truncate text-[18px] text-white">{row.name}</div>
            <div className="bg-clip-text text-[14px] font-extrabold uppercase text-transparent bg-[linear-gradient(192deg,#00FF22_10%,#D8FFDD_87%)]">
              {row.grade}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[14px] text-white">
            <BootstrapIcon name="patch-check" className="size-[14px]" colorClassName="bg-white" />
            <span className="font-extralight">{row.collectionLabel}</span>
            <span className="h-4 w-px bg-white/20" />
            <img src={row.collectionIconSrc} alt="" className="size-4 object-contain" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:flex lg:items-center lg:gap-8">
        <div className="w-[140px] shrink-0 text-right">
          <div className="text-[22px] font-extrabold uppercase text-white">{row.value}</div>
        </div>

        <div className="w-[80px] shrink-0 text-right">
          <div className="text-[18px] font-extrabold uppercase text-white/80">{row.discountLabel}</div>
        </div>

        <div className="w-[140px] shrink-0 text-right">
          <div className="bg-clip-text text-[22px] font-extrabold uppercase text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]">
            {row.highestBid}
          </div>
        </div>

        <div className="w-[114px] shrink-0">
          <div className="flex items-center gap-2 text-[16px]">
            <BootstrapIcon name="clock" className="size-[14px] opacity-70" colorClassName="bg-white" />
            <span className={cn(row.status === "Ending Soon" ? "text-[#FF7300]" : "text-white/80")}>
              {row.endsInLabel}
            </span>
          </div>
        </div>

        <div className="w-[64px] shrink-0 text-center">
          <div className="text-[18px] font-extrabold uppercase text-white">{row.bidsCount.toLocaleString()}</div>
        </div>

        <div className="w-[118px] shrink-0">
          <button
            type="button"
            disabled={isSold}
            className={cn(
              "h-10 w-full rounded-[8px] px-3 text-[16px] font-bold uppercase transition-[filter,background-color]",
              "disabled:pointer-events-none disabled:opacity-50",
              isSold ? "border border-white/20 text-white/70" : "bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)] text-black hover:brightness-105",
            )}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MaskedSvgIcon url={hammerCourt} className="size-5" colorClassName="bg-black" />
              BID
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuctionsListView({ rows }: { rows: AuctionCardData[] }) {
  return (
    <div>
      <div className="hidden items-center gap-8 px-3 pr-6 text-[16px] font-extralight text-white lg:flex">
        <div className="flex-1">Collectible</div>
        <div className="w-[140px] text-right">Value</div>
        <div className="w-[80px] text-right">Discount</div>
        <div className="w-[140px] text-right">Highest Bid</div>
        <div className="w-[114px]">Ends in</div>
        <div className="w-[64px] text-center">Bids</div>
        <div className="w-[118px]">{` `}</div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <AuctionListItem key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}

