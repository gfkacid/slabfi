import { cn } from "@/lib/utils";
import { BootstrapIcon, type BootstrapIconName } from "@/components/ui/BootstrapIcon";

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

function StatCard({ label, value, tone, icon }: Stat) {
  const isGreen = tone === "green";

  return (
    <div className="flex items-center gap-5 rounded-[20px] border border-white/20 bg-black/20 p-6">
      <div
        className={cn("flex h-[62px] w-[63px] items-center justify-center rounded-[16px]", {
          "bg-[linear-gradient(206deg,#00FF22_10%,#D8FFDD_87%)]": isGreen,
          "bg-[linear-gradient(206deg,#FF7300_10%,#FFD0A4_87%)]": !isGreen,
        })}
      >
        <BootstrapIcon name={icon} className="size-7" colorClassName="bg-black/70" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="text-[22px] font-normal leading-none text-white">{label}</div>
        <div
          className={cn("text-[36px] font-extrabold uppercase leading-none", {
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
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[20px] border border-white/20 bg-black/10 p-6", className)}>
      {title ? <div className="mb-5 text-[22px] leading-none text-white">{title}</div> : null}
      {children}
    </section>
  );
}

export function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-9">
        <div className="space-y-10">
          <header className="space-y-2">
            <div className="text-[48px] font-thin leading-none text-white">Dashboard</div>
            <div className="text-[18px] font-thin text-white/90">Welcome back, 0x4ac…921a</div>
          </header>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionCard title="Assets by Collection">
                <div className="rounded-[15px] bg-white/10 px-4 py-3 shadow-[-4px_4px_15px_0_rgba(0,0,0,0.40)]">
                  <div className="text-[22px] text-white">Total</div>
                  <div className="text-[36px] font-extrabold uppercase text-white">$2,140.20</div>
                  <div className="text-[16px] text-transparent bg-clip-text bg-[linear-gradient(183deg,#FF7300_10%,#FFD0A4_87%)]">
                    Debt: -$600.00
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {[
                    { name: "Collector Crypt", pct: "14%", value: "$300.00", tone: "orange" as const },
                    { name: "Courtyard", pct: "58%", value: "$1,240.20", tone: "blue" as const },
                    { name: "Beezie", pct: "28%", value: "$600.00", tone: "yellow" as const },
                  ].map((row) => (
                    <div key={row.name} className="space-y-2">
                      <div className="flex items-center gap-2 text-[16px]">
                        <span className="text-white/80">{row.name}</span>
                        <span className="ml-auto text-white/50">{row.pct}</span>
                      </div>
                      <div className="h-[6px] w-full rounded-full bg-white/20">
                        <div className="h-[6px] w-[40%] rounded-full bg-white/60" />
                      </div>
                      <div className="text-right text-[12px] text-transparent bg-clip-text bg-[linear-gradient(183deg,#FF7300_10%,#FFD0A4_87%)]">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-8">
              <SectionCard title="My Collectibles">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {[
                    { name: "Victini (SVP 208)", tag: "Promo", status: "Healthy", value: "$12.97" },
                    { name: "Jellicent ex (WHT 045)", tag: "Double rare", status: "Auction", value: "$23.40" },
                  ].map((item) => (
                    <div key={item.name} className="rounded-[20px] border border-white/20 bg-black/20 p-4">
                      <div className="flex gap-4">
                        <div className="h-[92px] w-[72px] rounded-[12px] bg-white/10" />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="text-[16px] text-white">{item.name}</div>
                          <div className="text-[12px] text-transparent bg-clip-text bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)]">
                            {item.tag}
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-transparent bg-clip-text bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)]">
                              {item.status}
                            </span>
                            <span className="text-white/50">HF: 2.8</span>
                          </div>
                          <div className="h-[6px] w-full rounded-full bg-white/20">
                            <div className="h-[6px] w-[70%] rounded-full bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)]" />
                          </div>
                          <div className="flex items-center justify-between text-[12px] text-white/60">
                            <span>Value:</span>
                            <span className="text-[14px] font-semibold text-transparent bg-clip-text bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)]">
                              {item.value}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className="h-9 rounded-[10px] border border-white/20 bg-white/5 text-[12px] font-semibold text-white/80 hover:bg-white/10"
                        >
                          WITHDRAW
                        </button>
                        <button
                          type="button"
                          className="h-9 rounded-[10px] bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)] text-[12px] font-semibold text-black hover:brightness-105"
                        >
                          BID
                        </button>
                      </div>
                    </div>
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

      <aside className="lg:col-span-3">
        <SectionCard title="My Borrows" className="h-full">
          <div className="space-y-4">
            {[1, 2].map((idx) => (
              <div key={idx} className="rounded-[20px] border border-white/20 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-20 rounded-[12px] bg-white/10" />
                  <div className="flex-1 space-y-1 text-[12px] text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Borrowed:</span>
                      <span className="text-transparent bg-clip-text bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)]">
                        {idx === 1 ? "$85.50" : "$12.80"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>APY:</span>
                      <span className="text-white">{idx === 1 ? "5.25%" : "6.50%"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Health Factor:</span>
                      <span className={cn(idx === 1 ? "text-white" : "text-red-400")}>
                        {idx === 1 ? "2.1" : "1.30 at risk"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>LTV Ratio:</span>
                      <span className="text-white">{idx === 1 ? "45%" : "52%"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="h-9 rounded-[10px] border border-white/20 bg-white/5 text-[12px] font-semibold text-white/80 hover:bg-white/10"
                  >
                    + ADD CARD
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-[10px] bg-[linear-gradient(183deg,#00FF22_10%,#D8FFDD_87%)] text-[12px] font-semibold text-black hover:brightness-105"
                  >
                    REPAY
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="flex h-[210px] w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-dashed border-white/20 bg-black/10 text-white/70 hover:bg-black/20"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-white/10">+</div>
              <div className="text-[14px]">Borrow</div>
            </button>
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}

