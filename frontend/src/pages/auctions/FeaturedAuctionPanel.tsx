import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon } from "@/components/ui/BootstrapIcon";

import hammerCourt from "@/assets/svgs/hammer-court.svg";

import type { AuctionCardData } from "@/pages/auctions/auctionsMock";

type FeaturedAuctionPanelProps = {
  auction: AuctionCardData;
};

function MetricCard({
  title,
  value,
  subtitle,
  valueClassName,
  subtitleClassName,
}: {
  title: string;
  value: string;
  subtitle: string;
  valueClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className="w-full flex flex-col gap-1 rounded-[15px] bg-white/10 px-2 py-1 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
      <div className="xl:text-sm text-xs font-normal text-white">{title}</div>
      <div className="flex flex-col xl:gap-0.5 gap-1 mt-1 xl:mt-0">
        <div className={cn("xl:text-2xl text-lg font-extrabold uppercase leading-none text-white", valueClassName)}>{value}</div>
        <div className={cn("xl:text-sm text-xs font-normal text-white/50", subtitleClassName)}>{subtitle}</div>
      </div>
    </div>
  );
}

function EndsInCard({
  parts,
}: {
  parts: readonly [
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
  ];
}) {
  return (
    <div className="w-full rounded-[15px] bg-white/10 p-3">
      <div className="flex items-center justify-center gap-2">
        <BootstrapIcon name="clock" className="size-[14px]" colorClassName="bg-white" />
        <div className="text-base font-extralight text-white">Ends In</div>
      </div>

      <div className="mt-3 flex items-start justify-center gap-1">
        {parts.map((p, idx) => {
          const isSeparator = p.label.length === 0;
          return (
            <div key={`${p.value}-${idx}`} className="flex flex-col items-center justify-center">
              <div
                className={cn(
                  "flex w-10 items-center justify-center overflow-hidden rounded-[13px] px-1 py-2",
                  "bg-[linear-gradient(209deg,#00FF22_10%,#D8FFDD_87%)]",
                )}
              >
                <div className="text-center text-xl font-semibold leading-none text-[#18181b]">{p.value}</div>
              </div>
              {!isSeparator ? (
                <div className="mt-2 text-center text-xs font-thin text-white">{p.label}</div>
              ) : (
                <div className="mt-2 h-[14px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeaturedAuctionPanel({ auction }: FeaturedAuctionPanelProps) {
  const [bid, setBid] = useState("$34.00");

  const endsInParts = useMemo(
    () =>
      [
        { value: "02", label: "days" },
        { value: "/", label: "" },
        { value: "04", label: "hours" },
        { value: ":", label: "" },
        { value: "33", label: "mins" },
      ] as const,
    [],
  );

  return (
    <section className="rounded-[20px] border flex flex-col xl:gap-6 gap-3 border-white/20 xl:pt-4 xl:pb-6 px-3 py-3 xl:px-6">
      <div className="text-[22px] font-normal text-white">Featured Auction</div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-start gap-2">
          <div className="xl:h-44 xl:w-32 h-36 w-22 shrink-0 overflow-hidden rounded-[15px]">
            <img src={auction.imageSrc} alt="" className="block h-full w-full object-cover" />
          </div>

          <div className="w-full flex flex-col gap-2">
            <MetricCard
              title="Highest Bid"
              value={auction.highestBid}
              subtitle={`${Math.max(auction.bidsCount, 0)} bids`}
              valueClassName="bg-clip-text text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]"
            />
            <MetricCard
              title="Market Value"
              value="$120.50"
              subtitle="Save 17%"
              subtitleClassName="bg-clip-text text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="truncate text-xl font-normal text-white">{auction.name}</div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-white">
              <BootstrapIcon name={auction.tierIcon} className="size-[14px]" colorClassName="bg-white" />
              <span className="font-extralight">{auction.collectionLabel}</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-clip-text text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]">
              <span className="text-[16px]">•</span>
              <span className="font-normal">Promo</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-px bg-white/20" />
              <img src={auction.collectionIconSrc} alt="" className="h-4 w-auto object-contain opacity-95" />
            </span>
          </div>
        </div>

        <div className="space-y-2 text-[16px]">
          <div className="flex items-center gap-2 text-white">
            <span className="flex-1 font-extralight opacity-60">Current Debt:</span>
            <span className="text-[18px] font-semibold uppercase">$80.00</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex-1 font-extralight opacity-60">Current Bid:</span>
            <span className="bg-clip-text text-[18px] font-semibold uppercase text-transparent bg-[linear-gradient(189deg,#00FF22_10%,#D8FFDD_87%)]">
              {auction.highestBid}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex-1 font-extralight opacity-60">Health Factor:</span>
            <span className="bg-clip-text text-[18px] font-semibold uppercase text-transparent bg-[linear-gradient(189deg,#FF0000_10%,#FFA4A4_87%)]">
              1.30 <span className="text-[12px] font-normal normal-case">at risk</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex-1 font-extralight opacity-60">LTV Ratio:</span>
            <span className="text-[18px] font-semibold uppercase">40%</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[14px] font-medium text-white/80">Your Bid</div>

          <div className="flex items-center gap-2 rounded-[8px] border border-white/30 bg-white/[0.05] px-4 py-2">
            <input
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              className="w-full bg-transparent text-[16px] font-extralight text-white placeholder:text-white/50 focus:outline-none"
              placeholder="$34.00"
              inputMode="decimal"
            />
            <button
              type="button"
              className="rounded-[8px] bg-[#27272a] px-3 py-1.5 text-[12px] font-semibold text-white"
              onClick={() => setBid("$120.50")}
            >
              Max
            </button>
          </div>

          <button
            type="button"
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-[8px]",
              "bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)] text-black",
              "text-[16px] font-bold uppercase hover:brightness-105 active:scale-[0.99] transition-[filter,transform]",
            )}
          >
            <MaskedSvgIcon url={hammerCourt} className="size-6" colorClassName="bg-black" />
            BID NOW
          </button>
        </div>

        <EndsInCard parts={endsInParts} />
      </div>
    </section>
  );
}

