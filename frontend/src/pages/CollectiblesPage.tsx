import { cn } from "@/lib/utils";
import { BootstrapIcon } from "@/components/ui/BootstrapIcon";
import { useId, useState } from "react";

import beezieIcon from "@/assets/pngs/beezie.png";
import collectorCryptIcon from "@/assets/pngs/collector_crypt.png";
import courtyardIcon from "@/assets/pngs/courtyard.png";
import hammerCourt from "@/assets/svgs/hammer-court.svg";

import { CollectiblesCardsView } from "@/pages/collectibles/CollectiblesCardsView";
import { CollectiblesListView } from "@/pages/collectibles/CollectiblesListView";
import {
  COLLECTIBLES_CARD_IMAGES,
  type CollectibleCardData,
  type CollectibleListRow,
  type TierRow,
} from "@/pages/collectibles/collectiblesMock";

const COLLECTIBLE_CARDS: CollectibleCardData[] = [
  {
    name: "Mega Kangaskhan ex (MEG 104)",
    grade: "PSA 9",
    tierIcon: "trophy",
    collectionIconSrc: collectorCryptIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[0],
    value: "$123.40",
  },
  {
    name: "Victini (SVP 208)",
    grade: "CGC 9",
    tierIcon: "award",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[1],
    overlays: [
      { kind: "pill", icon: "star-fill", className: "bg-black text-white" },
      { kind: "pill", icon: "arrow-up-right-circle", className: "bg-white text-black" },
    ],
    value: "$123.40",
  },
  {
    name: "Jellicent ex (WHT 045)",
    grade: "PSA 9",
    tierIcon: "x-diamond",
    collectionIconSrc: beezieIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[2],
    value: "$123.40",
  },
  {
    name: "Pawmi (PAF 226)",
    grade: "PSA 9",
    tierIcon: "trophy",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[3],
    overlays: [
      { kind: "pill-svg", url: hammerCourt, className: "bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)] text-black" },
      { kind: "pill", icon: "star-fill", className: "bg-black text-white" },
    ],
    value: "$123.40",
  },
  {
    name: "Psyduck (MEP 007)",
    grade: "PSA 9",
    tierIcon: "award",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[4],
    value: "$123.40",
  },
  {
    name: "Meloetta ex (MEL 200)",
    grade: "CGC 9",
    tierIcon: "x-diamond",
    collectionIconSrc: beezieIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[5],
    value: "$123.40",
  },
  {
    name: "Psyduck (MEP 007)",
    grade: "PSA 9",
    tierIcon: "award",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[6],
    value: "$123.40",
  },
  {
    name: "Victini (SVP 208)",
    grade: "PSA 9",
    tierIcon: "trophy",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[7],
    value: "$123.40",
  },
];

const COLLECTIBLES_LIST: CollectibleListRow[] = [
  {
    name: "Mega Kangaskhan ex (MEG 104)",
    grade: "PSA 9",
    collectionLabel: "Grail",
    collectionIconSrc: collectorCryptIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[0],
    value: "$2,345.67",
    status: "Warning",
    hf: "1.2",
  },
  {
    name: "Victini (SVP 208)",
    grade: "BGS 9.5",
    collectionLabel: "Grail",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[1],
    value: "$901.23",
    status: "Healthy",
    hf: "2.8",
    action: { label: "WITHDRAW", tone: "neutral" },
  },
  {
    name: "Jellicent ex (WHT 045)",
    grade: "CGC 9.5",
    collectionLabel: "Grail",
    collectionIconSrc: beezieIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[2],
    value: "$456.78",
    status: "Healthy",
    hf: "2.8",
  },
  {
    name: "Pawmi (PAF 226)",
    grade: "SGC 10",
    collectionLabel: "Grail",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[3],
    value: "$678.90",
    status: "Auction",
    hf: "0.8",
    action: { label: "BID", tone: "brand" },
  },
  {
    name: "Psyduck (MEP 007)",
    grade: "PSA 9",
    collectionLabel: "Grail",
    collectionIconSrc: courtyardIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[4],
    value: "$345.67",
    status: "Healthy",
    hf: "4.2",
  },
  {
    name: "Meloetta ex (BLK 044)",
    grade: "BGS 8",
    collectionLabel: "Grail",
    collectionIconSrc: beezieIcon,
    imageSrc: COLLECTIBLES_CARD_IMAGES[5],
    value: "$789.01",
    status: "Healthy",
    hf: "2.8",
  },
];

const TIER_ROWS: TierRow[] = [
  { label: "Grail", count: "x1", value: "$1,500", ltv: "60%", icon: "trophy" },
  { label: "Blue Chip", count: "x4", value: "$1,020", ltv: "50%", icon: "award" },
  { label: "Growth", count: "x2", value: "$820", ltv: "35%", icon: "graph-up-arrow" },
  { label: "Exotic", count: "x8", value: "$650", ltv: "25%", icon: "x-diamond" },
];

function SidebarMetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-black/10 p-5">
      <div className="text-[16px] font-extralight text-white/80">{title}</div>
      <div className="bg-clip-text text-[28px] font-extrabold uppercase leading-none text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]">
        {value}
      </div>
    </div>
  );
}

function TierBreakdownRow({ label, count, value, ltv, icon }: TierRow) {
  return (
    <div className="flex items-center gap-4 rounded-[15px] bg-white/10 p-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
      <div className="flex size-12 items-center justify-center rounded-[14px] bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]">
        <BootstrapIcon name={icon} className="size-6" colorClassName="bg-black" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[14px] font-extralight text-white/90">
          <span className="truncate">{label}</span>
          <span className="bg-clip-text font-extrabold uppercase text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]">
            {count}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[18px] font-extrabold uppercase text-white">{value}</span>
          <span className="bg-clip-text text-[14px] font-extrabold uppercase text-transparent bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]">
            {ltv} <span className="font-extralight text-white/70">LTV</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function CollectiblesPage() {
  const viewTabsId = useId();
  const [view, setView] = useState<"cards" | "list">("cards");

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
      <div className="2xl:col-span-9 col-span-8">
        <div className="space-y-10">
          <header className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="text-5xl font-thin leading-none text-white">Collectibles</div>
                <div className="text-[18px] font-thin text-white/90">
                  Manage your tokenized cards, monitor vault health, and use them as collateral.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex w-[320px] items-center gap-2 rounded-[200px] border border-white/30 bg-white/[0.05] px-4 py-3">
                  <BootstrapIcon name="search" className="size-[14px] opacity-50" colorClassName="bg-white" />
                  <span className="text-[16px] font-extralight leading-5 text-white/50">Search card or set...</span>
                </div>

                <div
                  className="flex items-center gap-1.5 rounded-[50px] bg-white/[0.08] p-2"
                  role="tablist"
                  aria-label="Collectibles view"
                >
                  <button
                    type="button"
                    id={`${viewTabsId}-cards`}
                    role="tab"
                    aria-selected={view === "cards"}
                    aria-controls={`${viewTabsId}-panel-cards`}
                    className={cn(
                      "flex size-[52px] items-center justify-center rounded-full transition-[background-color,box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      view === "cards"
                        ? "bg-white/[0.05] shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]"
                        : "hover:bg-white/[0.04] active:scale-[0.98]",
                    )}
                    onClick={() => setView("cards")}
                  >
                    <BootstrapIcon
                      name={view === "cards" ? "grid-fill" : "grid"}
                      className="size-5"
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
                      "flex size-[52px] items-center justify-center rounded-full transition-[background-color,box-shadow,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
                      colorClassName="bg-white"
                    />
                  </button>
                </div>

                <button
                  type="button"
                  className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]"
                  aria-label="Filters"
                >
                  <BootstrapIcon name="sliders2-vertical" className="size-[21px]" colorClassName="bg-black" />
                </button>
              </div>
            </div>
          </header>

          {view === "cards" ? (
            <section
              id={`${viewTabsId}-panel-cards`}
              role="tabpanel"
              aria-labelledby={`${viewTabsId}-cards`}
            >
              <CollectiblesCardsView cards={COLLECTIBLE_CARDS} />
            </section>
          ) : (
            <section id={`${viewTabsId}-panel-list`} role="tabpanel" aria-labelledby={`${viewTabsId}-list`}>
              <CollectiblesListView rows={COLLECTIBLES_LIST} />
            </section>
          )}
        </div>
      </div>

      <aside className="col-span-4 self-stretch 2xl:col-span-3">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <SidebarMetricCard title="TVL" value="$2023.40" />
            <div className="flex flex-col gap-2 rounded-[20px] border border-white/10 bg-black/10 p-5">
              <div className="text-[16px] font-extralight text-white/80">Total cards</div>
              <div className="text-[28px] font-extrabold uppercase leading-none text-white">81</div>
            </div>
          </div>

          <section className="rounded-[20px] border border-white/10 bg-black/10 p-5">
            <div className="mb-4 text-[16px] font-extralight text-white">Tiers Breakdown</div>
            <div className="space-y-3">
              {TIER_ROWS.map((row) => (
                <TierBreakdownRow key={row.label} {...row} />
              ))}
            </div>
          </section>

          <section className="min-h-[260px] rounded-[20px] border border-white/10 bg-black/10" />
        </div>
      </aside>
    </div>
  );
}

