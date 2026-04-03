import { PanelCard } from "@/components/slab-dashboard/PanelCard";
import { ProgressBar } from "@/components/slab-dashboard/ProgressBar";
import { SectionTitle } from "@/components/slab-dashboard/SectionTitle";

const rows = [
  { name: "Courtyard", value: "$1,240.20 (58%)", pct: 58, fill: "bg-secondary" },
  { name: "Beezy", value: "$600.00 (28%)", pct: 28, fill: "bg-yellow-400" },
  { name: "Alt", value: "$300.00 (14%)", pct: 14, fill: "bg-tertiary-fixed-dim" },
] as const;

const guestRows = [
  {
    name: "Courtyard",
    initial: "C",
    initialClass: "bg-blue-100 text-blue-600",
    items: "42 Items",
    value: "$214,300",
    delta: "+2.4%",
    deltaClass: "text-tertiary-fixed-dim",
  },
  {
    name: "Beezy",
    initial: "B",
    initialClass: "bg-amber-100 text-amber-600",
    items: "18 Items",
    value: "$42,910",
    delta: "-0.8%",
    deltaClass: "text-error",
  },
  {
    name: "Alt",
    initial: "A",
    initialClass: "bg-zinc-200 text-zinc-800",
    items: "12 Items",
    value: "$128,500",
    delta: "+5.1%",
    deltaClass: "text-tertiary-fixed-dim",
  },
] as const;

type PortfolioBreakdownProps = { guest?: boolean };

export function PortfolioBreakdown({ guest = false }: PortfolioBreakdownProps) {
  if (guest) {
    return (
      <section>
        <SectionTitle title="Portfolio Breakdown" />
        <PanelCard variant="panel" className="bg-surface-container-low">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xl font-extrabold tracking-tight text-primary">
                Assets by Platform
              </h3>
              <span className="rounded bg-secondary-fixed/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                Preview
              </span>
            </div>
            <div className="space-y-4">
              {guestRows.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${row.initialClass}`}
                    >
                      {row.initial}
                    </div>
                    <div>
                      <p className="font-headline text-sm font-bold text-primary">{row.name}</p>
                      <p className="text-xs text-on-surface-variant">{row.items}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-headline text-sm font-bold text-primary">{row.value}</p>
                    <p className={`text-[10px] font-bold ${row.deltaClass}`}>{row.delta}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs italic text-on-surface-variant">
              Sample portfolio data based on ecosystem averages.
            </p>
          </div>
        </PanelCard>
      </section>
    );
  }

  return (
    <section>
      <SectionTitle title="Portfolio Breakdown" />
      <PanelCard variant="panel">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold">Assets by Platform</span>
              <span className="text-xs opacity-60">USD Value</span>
            </div>
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.name}>
                  <div className="mb-1.5 flex justify-between text-xs font-medium">
                    <span>{row.name}</span>
                    <span>{row.value}</span>
                  </div>
                  <ProgressBar valuePercent={row.pct} fillClassName={row.fill} height="md" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center border-outline-variant/10 pl-0 md:border-l md:pl-8">
            <div className="text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total Assets
              </p>
              <p className="font-headline text-3xl font-extrabold">$2,140.20</p>
              <p className="mt-2 inline-block rounded bg-error/10 px-2 py-0.5 text-[10px] text-error">
                -$600.00 Debt
              </p>
            </div>
          </div>
        </div>
      </PanelCard>
    </section>
  );
}
