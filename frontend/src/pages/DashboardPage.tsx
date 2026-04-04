import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useModal } from "@/components/modal";
import {
  useAvailableCredit,
  usePosition,
  useCollateralItem,
  useOutstandingDebt,
  useOraclePrice,
} from "@/hooks";
import { HealthFactorBadge } from "@/components/HealthFactorBadge";
import { CollateralCard } from "@/components/CollateralCard";
import { LiquidationWarningBanner } from "@/components/LiquidationWarningBanner";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Button, LinkButton } from "@/components/ui/Button";
import { hubChain } from "@/lib/hub";
import { HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { formatUnits } from "viem";

export function DashboardPage() {
  const { openModal } = useModal();
  const { isConnected, chainId } = useAccount();
  const { data: availableCredit } = useAvailableCredit();
  const { data: position } = usePosition();
  const { data: debt } = useOutstandingDebt();

  const isHubChain = chainId === hubChain.id;

  if (!isConnected) {
    return (
      <div className="mx-auto min-h-full w-full max-w-2xl !bg-zinc-50">
        <PageHeader title="Dashboard" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">
            Connect your wallet to view your dashboard.
          </p>
        </Card>
      </div>
    );
  }

  if (!isHubChain) {
    return (
      <div className="mx-auto min-h-full w-full max-w-2xl !bg-zinc-50">
        <PageHeader title="Dashboard" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">
            Switch to {hubChain.name} to view your lending dashboard.
          </p>
        </Card>
      </div>
    );
  }

  const creditFormatted =
    availableCredit !== undefined
      ? `$${Number(formatUnits(availableCredit, HUB_USDC_DECIMALS)).toFixed(2)}`
      : "—";
  const principal = debt !== undefined ? Number(formatUnits(debt[0], HUB_USDC_DECIMALS)) : 0;
  const interest = debt !== undefined ? Number(formatUnits(debt[1], HUB_USDC_DECIMALS)) : 0;
  const totalDebtFormatted = `$${(principal + interest).toFixed(2)}`;
  const collateralCount = position?.collateralIds?.length ?? 0;

  return (
    <div className="min-h-full w-full !bg-zinc-50">
      <PageHeader title="Dashboard" />

      <LiquidationWarningBanner />

      {/* Top stats — 4 columns on md+ */}
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Available to borrow"
          value={creditFormatted}
          hint="USDC on hub"
        />
        <DashboardStatCard
          label="Health factor"
          value={<HealthFactorBadge />}
          hint="Position status"
        />
        <DashboardStatCard
          label="Total debt"
          value={totalDebtFormatted}
          hint="Principal + interest"
        />
        <DashboardStatCard
          label="Hub & collateral"
          value={collateralCount}
          hint={hubChain.name}
        />
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section>
            <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">
              Position overview
            </h2>
            <Card variant="elevated" className="rounded-2xl">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-bold text-on-surface">Borrowing power</p>
                  <p className="font-headline text-3xl font-extrabold text-primary">
                    {creditFormatted}
                  </p>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Available credit reflects collateral posted on the hub chain.
                  </p>
                </div>
                <div className="flex flex-col justify-center border-outline-variant/10 md:border-l md:pl-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Outstanding
                  </p>
                  <p className="mt-1 font-headline text-3xl font-extrabold text-primary">
                    {totalDebtFormatted}
                  </p>
                  <Link
                    to="/repay"
                    className="mt-3 inline-flex text-xs font-bold text-secondary hover:underline"
                  >
                    Make a repayment →
                  </Link>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-headline text-xl font-extrabold text-primary">
                Active collateral
              </h2>
              <button
                type="button"
                onClick={() => openModal("collateralDeposit")}
                className="text-xs font-medium text-secondary hover:underline"
              >
                Lock more
              </button>
            </div>
            {position?.collateralIds?.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {position.collateralIds.map((cid) => (
                  <CollateralCardWithPrice key={cid} collateralId={cid as `0x${string}`} />
                ))}
              </div>
            ) : (
              <Card variant="muted" className="p-8 text-center">
                <p className="text-sm text-on-surface-variant">
                  No collateral locked. Lock NFTs on Ethereum Sepolia to get started.
                </p>
                <Button
                  type="button"
                  variant="accent"
                  className="mt-4"
                  onClick={() => openModal("collateralDeposit")}
                >
                  Lock collateral
                </Button>
              </Card>
            )}
          </section>
        </div>

        <aside className="col-span-12 space-y-8 lg:col-span-4">
          <section>
            <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">
              Lending position
            </h2>
            <Card variant="inverse" className="relative overflow-hidden rounded-2xl">
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-secondary opacity-10 blur-3xl" />
              <div className="relative">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
                      {hubChain.name}
                    </p>
                    <h3 className="font-headline text-2xl font-extrabold tracking-tight">
                      USDC loan
                    </h3>
                  </div>
                  <Icon name="account_balance" className="!text-3xl text-secondary-fixed-dim" />
                </div>
                <div className="space-y-4 border-b border-white/10 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Total debt</span>
                    <span className="font-bold">{totalDebtFormatted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Collateral items</span>
                    <span className="font-bold">{collateralCount}</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-2">
                  <LinkButton to="/borrow" variant="accent" className="w-full justify-center">
                    Borrow
                  </LinkButton>
                  <LinkButton
                    to="/repay"
                    variant="primary"
                    className="w-full justify-center bg-white/10 hover:bg-white/20"
                  >
                    Repay
                  </LinkButton>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => openModal("collateralDeposit")}
                className="group flex w-full items-center justify-between rounded-xl bg-surface-container-high p-4 text-left transition-all hover:bg-secondary-fixed/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon name="add_moderator" className="!text-xl text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Lock collateral</p>
                    <p className="text-[9px] text-on-surface-variant">Increase borrowing power</p>
                  </div>
                </div>
                <Icon
                  name="chevron_right"
                  className="!text-lg opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                />
              </button>
              <Link
                to="/borrow"
                className="group flex items-center justify-between rounded-xl bg-surface-container-high p-4 transition-all hover:bg-secondary-fixed/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon name="payments" className="!text-xl text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Borrow USDC</p>
                    <p className="text-[9px] text-on-surface-variant">Draw against collateral</p>
                  </div>
                </div>
                <Icon
                  name="chevron_right"
                  className="!text-lg opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                />
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-headline text-xl font-extrabold text-primary">Protocol</h2>
            <Card variant="elevated" className="rounded-2xl">
              <p className="text-sm text-on-surface-variant">
                Pool parameters and liquidations are enforced on-chain. Use the liquidations view to
                monitor undercollateralized positions.
              </p>
              <Link
                to="/liquidations"
                className="mt-4 inline-flex text-xs font-bold text-secondary hover:underline"
              >
                Open liquidation queue →
              </Link>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DashboardStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card
      variant="muted"
      className="flex flex-col gap-1 transition-transform hover:scale-[1.01] hover:shadow-slab-md"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <div className="flex min-h-9 items-center font-headline text-2xl font-extrabold text-primary">
        {value}
      </div>
      {hint ? (
        <p className="text-[10px] font-medium tracking-tight text-on-surface-variant/70">{hint}</p>
      ) : null}
    </Card>
  );
}

function CollateralCardWithPrice({ collateralId }: { collateralId: `0x${string}` }) {
  const { data: item } = useCollateralItem(collateralId);
  const { data: priceData } = useOraclePrice(
    item?.collection as `0x${string}` | undefined,
    item?.tokenId !== undefined ? BigInt(item.tokenId) : undefined
  );

  if (!item) return null;

  const priceUSD = priceData?.[0];
  return (
    <CollateralCard
      collateralId={collateralId}
      tokenId={BigInt(item.tokenId)}
      collection={item.collection as `0x${string}`}
      status={Number(item.status)}
      priceUSD={priceUSD}
    />
  );
}
