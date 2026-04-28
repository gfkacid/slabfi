import { cn } from "@/lib/utils";
import { BootstrapIcon, MaskedSvgIcon, type BootstrapIconName } from "@/components/ui/BootstrapIcon";

import beezieIcon from "@/assets/pngs/beezie.png";
import collectorCryptIcon from "@/assets/pngs/collector_crypt.png";
import courtyardIcon from "@/assets/pngs/courtyard.png";
import borrowIcon from "@/assets/svgs/borrow.svg";

type StatTone = "green" | "orange";

type Stat = {
  label: string;
  value: string;
  tone: StatTone;
  icon: BootstrapIconName;
};

const STATS: Stat[] = [
  { label: "Net Worth", value: "$470.80", tone: "green", icon: "wallet2" },
  { label: "Collectibles", value: "$319.10", tone: "green", icon: "file-post" },
  { label: "USDC supplied", value: "$250.00", tone: "green", icon: "currency-dollar" },
  { label: "Debt", value: "$98.30", tone: "orange", icon: "exclamation-triangle" },
];

type CollectionRow = {
  name: string;
  pct: number;
  value: string;
  iconSrc: string;
  gradient: string;
};

const COLLECTION_ROWS: CollectionRow[] = [
  {
    name: "Collector Crypt",
    pct: 14,
    value: "$ 300.00",
    iconSrc: collectorCryptIcon,
    gradient: "linear-gradient(182.87275577740496deg, rgb(255, 115, 0) 10.472%, rgb(255, 208, 164) 87.188%)",
  },
  {
    name: "Courtyard",
    pct: 58,
    value: "$ 1,240.20",
    iconSrc: courtyardIcon,
    gradient: "linear-gradient(182.962841064208deg, rgb(55, 135, 255) 10.472%, rgb(139, 179, 238) 87.188%)",
  },
  {
    name: "Beezie",
    pct: 28,
    value: "$ 600.00",
    iconSrc: beezieIcon,
    gradient: "linear-gradient(182.9171036893286deg, rgb(255, 177, 0) 10.472%, rgb(255, 219, 138) 87.188%)",
  },
];

function CollectionProgressRow({ name, pct, value, iconSrc, gradient }: CollectionRow) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[16px]">
        <img src={iconSrc} alt="" className="size-4 shrink-0 object-contain" />
        <span className="flex-1 bg-clip-text text-transparent" style={{ backgroundImage: gradient }}>
          {name}
        </span>
        <span className="shrink-0 text-white/50">{pct}%</span>
      </div>

      <div className="h-[6px] w-full rounded-full bg-white/20">
        <div className="relative h-[6px] rounded-full" style={{ width: `${pct}%`, backgroundImage: gradient }}>
          <span className="-translate-y-1/2 absolute right-0 top-1/2 size-1 rounded-full bg-white" />
        </div>
      </div>

      <div className="text-right text-[12px] bg-clip-text text-transparent" style={{ backgroundImage: gradient }}>
        {value}
      </div>
    </div>
  );
}

const SET_ICON_VICTINI = "https://www.figma.com/api/mcp/asset/1e3f442e-39c9-4674-82e2-f9480e2add3e";
const CARD_IMAGE_VICTINI = "https://www.figma.com/api/mcp/asset/3b18a11f-cb8c-4753-81e7-5e4ae2e95c37";
const CARD_IMAGE_JELLICENT = "https://www.figma.com/api/mcp/asset/1e3f442e-39c9-4674-82e2-f9480e2add3e";

type TierIcon = "trophy" | "award" | "graph-up-arrow" | "x-diamond";

type Collectible = {
  name: string;
  setIconSrc: string;
  cardImageSrc: string;
  grade: string;
  tierIcon: TierIcon;
  appIconSrc: string;
  status: "Healthy" | "Auction";
  hf: string;
  value: string;
  action: "WITHDRAW" | "BID";
};

const COLLECTIBLES: Collectible[] = [
  {
    name: "Victini (SVP 208)",
    setIconSrc: SET_ICON_VICTINI,
    cardImageSrc: CARD_IMAGE_VICTINI,
    grade: "Promo",
    tierIcon: "trophy",
    appIconSrc: courtyardIcon,
    status: "Healthy",
    hf: "2.8",
    value: "$12.97",
    action: "WITHDRAW",
  },
  {
    name: "Jellicent ex (WHT 045)",
    setIconSrc: SET_ICON_VICTINI,
    cardImageSrc: CARD_IMAGE_JELLICENT,
    grade: "Double rare",
    tierIcon: "x-diamond",
    appIconSrc: beezieIcon,
    status: "Auction",
    hf: "0.8",
    value: "$23.40",
    action: "BID",
  },
];

function CollectibleCard({
  name,
  setIconSrc,
  cardImageSrc,
  grade,
  tierIcon,
  appIconSrc,
  status,
  hf,
  value,
  action,
}: Collectible) {
  const isAuction = status === "Auction";
  const statusGradient = isAuction
    ? "bg-[linear-gradient(184deg,#FF0000_10%,#FFA4A4_87%)]"
    : "bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)]";
  const valueGradient = isAuction
    ? "bg-[linear-gradient(191deg,#FF0000_10%,#FFA4A4_87%)]"
    : "bg-[linear-gradient(191deg,#00FF22_10%,#D8FFDD_87%)]";

  return (
    <div className="relative flex items-stretch gap-5 rounded-[20px] border border-white/20 p-3">
      <div className="w-40 h-full shrink-0 self-stretch overflow-hidden rounded-[15px]">
        <img src={cardImageSrc} alt="" className="block  w-full object-cover" />
      </div>

      <div className="flex h-full w-full min-w-0 flex-1 flex-col justify-between">
       
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <img src={setIconSrc} alt="" className="size-5 shrink-0 object-contain" />
              <div className="min-w-0 flex-1 truncate text-lg text-white">{name}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[16px] bg-clip-text text-transparent bg-[linear-gradient(191deg,#00FF22_10%,#D8FFDD_87%)]">
                {grade}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <BootstrapIcon name={tierIcon} className="size-[14px]" colorClassName="bg-white" />
                <span className="h-4 w-px bg-white/20" />
                <img src={appIconSrc} alt="" className="size-4 shrink-0 object-contain" />
              </div>
            </div>
          </div>
       

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[16px]">
            <span className={cn("bg-clip-text text-transparent", statusGradient)}>{status}</span>
            <span className="text-white/50">HF: {hf}</span>
          </div>
          <div className="h-[6px] w-full rounded-full bg-white/20">
            <div className={cn("h-[6px] rounded-full", statusGradient)} style={{ width: isAuction ? "22%" : "70%" }} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.08] px-3 py-1.5">
            <span className="flex-1 text-[12px] font-extralight text-white">Value:</span>
            <span className={cn("text-[18px] font-extrabold uppercase bg-clip-text text-transparent", valueGradient)}>
              {value}
            </span>
          </div>

          <button
            type="button"
            className={cn(
              "h-10 w-full rounded-[8px] px-3 text-[16px] font-bold uppercase transition-[filter,background-color]",
              action === "BID"
                ? "bg-[linear-gradient(184deg,#00FF22_10%,#D8FFDD_87%)] text-black hover:brightness-105"
                : "border border-zinc-400/70 text-zinc-400 hover:bg-white/5",
            )}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, icon }: Stat) {
  const isGreen = tone === "green";

  return (
    <div className="flex items-center 2xl:gap-4 gap-2 rounded-[20px] border border-white/20 bg-black/20 p-2 2xl:p-4">
      <div
        className={cn("flex 2xl:h-14 2xl:w-14 h-10 w-10 aspect-square items-center justify-center 2xl:rounded-2xl rounded-xl", {
          "bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]": isGreen,
          "bg-[linear-gradient(206deg,#FF7300_10%,#FFD0A4_87%)]": !isGreen,
        })}
      >
        <BootstrapIcon name={icon} className="2xl:size-7 size-5" colorClassName="bg-black" />
      </div>
      <div className="flex flex-1 flex-col 2xl:gap-1 gap-2">
        <div className="2xl:text-lg text-sm font-normal leading-none text-white">{label}</div>
        <div
          className={cn("2xl:text-4xl text-2xl font-extrabold uppercase leading-none", {
            "text-transparent bg-clip-text bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)]": isGreen,
            "text-transparent bg-clip-text bg-[linear-gradient(186deg,#FF7300_10%,#FFD0A4_87%)]": !isGreen,
          })}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  unstyled = false,
  className,
  children,
}: {
  title?: string;
  unstyled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(unstyled ? "" : "rounded-[20px] border border-white/20 bg-black/10 p-5", className)}
    >
      {title ? (
        <div className={cn("text-xl leading-none text-white", unstyled ? "mb-6" : "mb-5")}>{title}</div>
      ) : null}
      {children}
    </section>
  );
}

export function DashboardPage() {
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
            <div className="text-5xl font-thin leading-none text-white">Dashboard</div>
            <div className="text-[18px] font-thin text-white/90">Welcome back, 0x4ac…921a</div>
          </header>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3 flex">
              <SectionCard title="Assets by Collection" className="flex w-full flex-col">
                <div className="rounded-[15px] bg-white/10 px-3 py-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
                  <div className="text-lg text-white">Total</div>
                  <div className="text-3xl font-extrabold uppercase text-white">$2,140.20</div>
                  <div className="text-base text-transparent bg-clip-text bg-[linear-gradient(183deg,#FF7300_10%,#FFD0A4_87%)]">
                    Debt: -$600.00
                  </div>
                </div>

                <div className="mt-12 flex-1 space-y-5">
                  {COLLECTION_ROWS.map((row) => (
                    <CollectionProgressRow key={row.name} {...row} />
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-9">
              <SectionCard title="My Collectibles" unstyled>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {COLLECTIBLES.map((item) => (
                    <CollectibleCard key={item.name} {...item} />
                  ))}

                  <button
                    type="button"
                    className="flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-white/20 bg-black/10 text-white/70 hover:bg-black/20"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/10 text-xl">+</div>
                    <div className="text-[14px]">Add Card</div>
                  </button>
                </div>
              </SectionCard>
            </div>
          </section>
        </div>
      </div>

      <aside className="sticky top-24 col-span-4 h-[calc(100vh-8rem)] self-start 2xl:col-span-3">
        <SectionCard title="My Borrows" className="flex h-full flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-[15px] flex flex-col gap-4 bg-white/10 p-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]"
              >
                <div className="flex items-center gap-[18px]">
                  <div className="flex items-center pr-12">
                    <div className="flex items-center">
                      <div className="-mr-12 h-24 w-[68px] overflow-hidden rounded-[8px] border-[3px] border-[#1a1a1a] shadow-[-4px_4px_8px_0_rgba(0,0,0,0.25)]">
                        <div className="h-full w-full bg-white/10" />
                      </div>
                      <div className="-mr-12 h-24 w-[68px] overflow-hidden rounded-[8px] border-[3px] border-[#1a1a1a] shadow-[-4px_4px_8px_0_rgba(0,0,0,0.25)]">
                        <div className="h-full w-full bg-white/10" />
                      </div>
                      <div className="-mr-12 relative flex h-24 w-[68px] items-center justify-center rounded-[8px] bg-black shadow-[-4px_4px_4px_rgba(0,0,0,0.25)] before:pointer-events-none before:absolute before:inset-0.5 before:rounded-[6px] before:border before:border-dashed before:border-[#0f2]">
                        <span className="text-center text-[18px] uppercase text-transparent bg-clip-text bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]">
                          +2
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5 text-[14px]">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-extralight text-white">Borrowed:</span>
                      <span className="text-[18px] font-extrabold uppercase text-transparent bg-clip-text bg-[linear-gradient(190deg,#00FF22_10%,#D8FFDD_87%)]">
                        {idx === 1 ? "$85.50" : "$12.80"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="flex-1 font-extralight">APY:</span>
                      <span className="font-extrabold uppercase">{idx === 1 ? "5.25%" : "6.50%"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-extralight text-white">Health Factor:</span>
                      <span className="font-extrabold uppercase text-transparent bg-clip-text bg-[linear-gradient(198deg,#00FF22_10%,#D8FFDD_87%)]">
                        {idx === 1 ? "2.10" : "1.30"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="flex-1 font-extralight">LTV Ratio:</span>
                      <span className="font-extrabold uppercase">{idx === 1 ? "45%" : "52%"}</span>
                    </div>
                  </div>
                </div>

                <div className=" grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="flex h-8 items-center justify-center gap-2 rounded-[8px] border border-zinc-400/70 px-3 text-sm font-bold uppercase text-zinc-400 hover:bg-white/5"
                  >
                    <span className="text-base leading-none">+</span>
                    Add Card
                  </button>
                  <button
                    type="button"
                    className="h-8 rounded-[8px] bg-[linear-gradient(186deg,#00FF22_10%,#D8FFDD_87%)] px-3 text-sm font-bold uppercase text-black hover:brightness-105"
                  >
                    REPAY
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="flex h-40 w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-white/20 bg-black/10 text-white/70 hover:bg-black/20"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/10">
                <MaskedSvgIcon url={borrowIcon} className="size-5" colorClassName="bg-white" />
              </div>
              <div className="text-[14px]">Borrow</div>
            </button>
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}

