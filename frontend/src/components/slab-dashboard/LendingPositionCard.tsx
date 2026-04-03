import { Icon } from "@/components/ui/Icon";
import { SlabButton } from "@/components/slab-dashboard/SlabButton";

const LTV_PCT = 40;
const LTV_MAX_PCT = 60;

export function LendingPositionCard() {
  const ltvBarWidthPct = (LTV_PCT / LTV_MAX_PCT) * 100;
  return (
    <section>
      <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">Lending Position</h2>
      <div className="group relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-xl">
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-secondary opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
        <div className="relative mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
              Arc Testnet
            </p>
            <h4 className="font-headline text-2xl font-extrabold tracking-tight">USDC Loan</h4>
          </div>
          <Icon name="account_balance" className="text-secondary-fixed-dim" />
        </div>
        <div className="relative space-y-4">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <p className="text-sm font-medium opacity-70">Accrued Interest</p>
            <div className="text-right">
              <p className="text-lg font-bold">8% APR</p>
              <p className="text-[10px] text-tertiary-fixed-dim">+$12.40 total</p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium opacity-70">Current LTV</p>
              <p className="text-sm font-bold">
                {LTV_PCT}%{" "}
                <span className="text-[10px] font-medium opacity-40">/ {LTV_MAX_PCT}% max</span>
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-secondary-fixed-dim shadow-[0_0_8px_rgba(173,198,255,0.5)]"
                style={{ width: `${ltvBarWidthPct}%` }}
              />
            </div>
          </div>
        </div>
        <SlabButton variant="manageLoan" className="mt-6">
          Manage Loan
        </SlabButton>
      </div>
    </section>
  );
}
