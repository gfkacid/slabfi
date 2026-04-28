import React, { useId, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { BootstrapIcon, type BootstrapIconName } from "@/components/ui/BootstrapIcon";

import { AuctionsCardsView } from "@/pages/auctions/AuctionsCardsView";
import { AuctionsListView } from "@/pages/auctions/AuctionsListView";
import { AUCTION_CARDS, FEATURED_AUCTIONS, type AuctionCardData } from "@/pages/auctions/auctionsMock";
import { FeaturedAuctionPanel } from "@/pages/auctions/FeaturedAuctionPanel";

type StatTone = "green" | "orange";

type Stat = {
  label: string;
  value: string;
  tone: StatTone;
  icon: BootstrapIconName;
  valueVariant?: "gradient" | "white";
  iconTone?: StatTone;
};

function StatCard({ label, value, tone, icon, valueVariant = "gradient", iconTone }: Stat) {
  const resolvedIconTone = iconTone ?? tone;
  const isGreenIcon = resolvedIconTone === "green";
  const isWhiteValue = valueVariant === "white";

  return (
    <div className="flex items-center 2xl:gap-4 gap-2 rounded-[20px] border border-white/20 bg-black/20 p-2 2xl:p-4">
      <div
        className={cn("flex 2xl:h-14 2xl:w-14 h-10 w-10 aspect-square items-center justify-center 2xl:rounded-2xl rounded-xl", {
          "bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]": isGreenIcon,
          "bg-[linear-gradient(206deg,#FF7300_10%,#FFD0A4_87%)]": !isGreenIcon,
        })}
      >
        <BootstrapIcon name={icon} className="2xl:size-7 size-5" colorClassName="bg-black" />
      </div>
      <div className="flex flex-1 flex-col 2xl:gap-1 gap-2">
        <div className="2xl:text-lg text-sm font-normal leading-none text-white">{label}</div>
        <div
          className={cn(
            "2xl:text-4xl text-2xl font-extrabold uppercase leading-none",
            isWhiteValue
              ? "text-white"
              : tone === "green"
                ? "text-transparent bg-clip-text bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]"
                : "text-transparent bg-clip-text bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const FEATURED_AUCTION = FEATURED_AUCTIONS[0];

export function AuctionsPage() {
  const filterTabsId = useId();
  const viewTabsId = useId();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "list">("cards");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AUCTION_CARDS.filter((a) => {
      const matchesQuery = q.length === 0 ? true : `${a.name} ${a.grade}`.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [query]);

  const liveCount = AUCTION_CARDS.filter((a) => a.status === "Live" || a.status === "Ending Soon").length;
  const endingCount = AUCTION_CARDS.filter((a) => a.status === "Ending Soon").length;
  const totalValue = "$249.95";
  const avgDiscount = "23%";

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
      <div className="2xl:col-span-9 col-span-8 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:self-start">
        <div
          className={cn(
            "relative space-y-10 pb-16",
            "lg:h-full lg:overflow-y-auto lg:pr-1",
            "lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]",
            "lg:[-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)]",
            "lg:[mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%_-_96px),transparent_100%)]",
          )}
        >
          <header className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="text-5xl font-thin leading-none text-white">Auctions</div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-[320px] items-center gap-2 rounded-[200px] border border-white/30 bg-white/[0.05] px-4 py-3">
                  <BootstrapIcon name="search" className="size-[14px] opacity-50" colorClassName="bg-white" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search card or set..."
                    className="w-full bg-transparent text-[16px] font-extralight leading-5 text-white placeholder:text-white/45 focus:outline-none"
                  />
                </label>

                <div
                  className="flex items-center gap-1.5 rounded-[50px] bg-white/[0.08] p-1"
                  role="tablist"
                  aria-label="Auctions view"
                >
                  <button
                    type="button"
                    id={`${viewTabsId}-cards`}
                    role="tab"
                    aria-selected={view === "cards"}
                    aria-controls={`${viewTabsId}-panel-cards`}
                    className={cn(
                      "flex size-[52px] items-center justify-center rounded-[100px] p-[14px] transition-[background-color,box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      view === "cards"
                        ? "bg-white/[0.05] shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]"
                        : "hover:bg-white/[0.04] active:scale-[0.98]",
                    )}
                    onClick={() => setView("cards")}
                    aria-label="Cards view"
                  >
                    <BootstrapIcon
                      name={view === "cards" ? "grid-3x3-gap-fill" : "grid-3x3-gap"}
                      className="size-5"
                      gradient={view === "cards"}
                      colorClassName="bg-white"
                    />
                  </button>
                  <button
                    type="button"
                    id={`${viewTabsId}-list`}
                    role="tab"
                    aria-selected={view === "list"}
                    aria-controls={`${viewTabsId}-panel-list`}
                    className={cn(
                      "flex size-[52px] items-center justify-center rounded-[100px] p-[14px] transition-[background-color,box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      view === "list"
                        ? "bg-white/[0.05] shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]"
                        : "hover:bg-white/[0.04] active:scale-[0.98]",
                    )}
                    onClick={() => setView("list")}
                    aria-label="List view"
                  >
                    <BootstrapIcon
                      name="list"
                      className={cn("size-5", view === "list" ? "opacity-100" : "opacity-50")}
                      gradient={view === "list"}
                      colorClassName="bg-white"
                    />
                  </button>
                </div>

                <button
                  type="button"
                  className="flex size-[48px] items-center justify-center rounded-[100px] bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]"
                  aria-label="Filters"
                >
                  <BootstrapIcon name="sliders2-vertical" className="size-5" colorClassName="bg-black" />
                </button>
              </div>
            </div>

            <div className="text-[18px] font-thin text-white/90">
              Acquire discounted collectibles from liquidated positions in live protocol auctions.
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Live Auctions" value={`${liveCount}`} tone="green" icon="globe2" />
            <StatCard label="Total Value" value={totalValue} tone="green" icon="currency-dollar" valueVariant="white" />
            <StatCard
              label="Avg Discount"
              value={avgDiscount}
              tone="orange"
              icon="tags"
              iconTone="green"
              valueVariant="white"
            />
          </section>

          <section id={`${filterTabsId}-grid`} aria-label="Auction listings">
            {filtered.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-white/20 bg-black/10 p-10 text-center">
                <div className="text-[18px] font-semibold text-white">No auctions found</div>
                <div className="mt-2 text-[14px] font-extralight text-white/70">Try a different search term.</div>
              </div>
            ) : view === "cards" ? (
              <div id={`${viewTabsId}-panel-cards`} role="tabpanel" aria-labelledby={`${viewTabsId}-cards`}>
                <AuctionsCardsView cards={filtered} />
              </div>
            ) : (
              <div id={`${viewTabsId}-panel-list`} role="tabpanel" aria-labelledby={`${viewTabsId}-list`}>
                <AuctionsListView rows={filtered} />
              </div>
            )}
          </section>
        </div>
      </div>

      <aside className="sticky top-24 col-span-4 h-[calc(100vh-8rem)] self-start 2xl:col-span-3">
        <div className="h-full space-y-6 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <FeaturedAuctionPanel auction={FEATURED_AUCTION} />
        </div>
      </aside>
    </div>
  );
}

