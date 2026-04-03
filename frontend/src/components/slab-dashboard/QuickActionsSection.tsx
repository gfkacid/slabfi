import { Link } from "react-router-dom";
import { useModal } from "@/components/modal";
import { Icon } from "@/components/ui/Icon";
import { dashboardSurface } from "@/components/slab-dashboard/dashboardTokens";

const actions = [
  {
    icon: "savings" as const,
    title: "Deposit USDC",
    subtitle: "Supply to the lending pool",
    to: "/lending",
  },
  {
    icon: "payments" as const,
    title: "Borrow USDC",
    subtitle: "Instant liquidity",
    to: "/lending?tab=borrow",
  },
  {
    icon: "add_moderator" as const,
    title: "Lock Collateral",
    subtitle: "Increase borrowing power",
    openCollateralDeposit: true as const,
  },
] as const;

export function QuickActionsSection() {
  const { openModal } = useModal();

  return (
    <section>
      <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((a) =>
          "openCollateralDeposit" in a ? (
            <button
              key={a.title}
              type="button"
              onClick={() => openModal("collateralDeposit")}
              className={`${dashboardSurface.quickAction} w-full text-left`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 shadow-sm ring-1 ring-zinc-200/60">
                  <Icon name={a.icon} className="!text-xl text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{a.title}</p>
                  <p className="text-[9px] text-on-surface-variant">{a.subtitle}</p>
                </div>
              </div>
              <Icon
                name="chevron_right"
                className="!text-sm opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100"
              />
            </button>
          ) : (
            <Link key={a.title} to={a.to} className={dashboardSurface.quickAction}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 shadow-sm ring-1 ring-zinc-200/60">
                  <Icon name={a.icon} className="!text-xl text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{a.title}</p>
                  <p className="text-[9px] text-on-surface-variant">{a.subtitle}</p>
                </div>
              </div>
              <Icon
                name="chevron_right"
                className="!text-sm opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100"
              />
            </Link>
          )
        )}
      </div>
    </section>
  );
}
