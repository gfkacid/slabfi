import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { LENDING_POOL_ABI } from "@slabfinance/shared";
import { TierCollateralCard } from "@/components/shared/lending/TierCollateralCard";
import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import {
  useAvailableCredit,
  useBorrow,
  useUserCollateral,
  useHubExistingCollateral,
  useHubOutstandingTotal,
  usePreviewHealthFactorOnHub,
  formatHealthFactor,
} from "@/hooks";
import { HubCollateralSyncCallout } from "@/components/shared/lending/HubCollateralSyncCallout";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import {
  collateralDisplayImageUrl,
  collateralDisplaySubtitle,
  collateralDisplayTitle,
} from "@/lib/collateralDisplay";
import { collateralLatestUsdNumber, formatUsdNumber } from "@/lib/hubFormat";
import { HUB_USDC_DECIMALS, PROTOCOL_TIER_ROWS } from "@slabfinance/shared";

export function BorrowLendingPanel() {
  const { isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  const { data: credit } = useAvailableCredit();
  const { writeContractAsync, isPending } = useBorrow();
  const { data: items } = useUserCollateral();
  const hubSlice = useHubExistingCollateral(Boolean(isConnected && isHubEvm(chainId)));
  const outstanding = useHubOutstandingTotal(Boolean(isConnected && isHubEvm(chainId)));

  const poolAddr = hubContracts.lendingPool;
  const isHub = isHubEvm(chainId);

  const amountWei = useMemo(() => {
    try {
      if (!amount || amount === ".") return 0n;
      return parseUnits(amount, HUB_USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount]);

  const currentTotalDebt = outstanding.data?.[2];
  const previewDebt =
    currentTotalDebt !== undefined ? currentTotalDebt + amountWei : undefined;

  const previewHf = usePreviewHealthFactorOnHub(
    hubSlice.data?.valuesPrice8,
    hubSlice.data?.tiers,
    previewDebt,
    Boolean(
      hubSlice.data?.valuesPrice8?.length &&
        amountWei > 0n &&
        previewDebt !== undefined,
    ),
  );

  const maxBorrow = credit ?? 0n;
  const maxStr = formatUnits(maxBorrow, HUB_USDC_DECIMALS);

  const canBorrow =
    isHub &&
    poolAddr &&
    amountWei > 0n &&
    amountWei <= maxBorrow;

  const handleBorrow = async () => {
    if (!canBorrow || !poolAddr) return;
    try {
      await writeContractAsync({
        address: poolAddr,
        abi: LENDING_POOL_ABI,
        functionName: "borrow",
        args: [amountWei],
      });
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  };

  /** Show recent locked rows even when hub oracle price is not indexed yet (`latestPriceUsd` empty). */
  const topCollateral = (items ?? []).slice(0, 2);

  return (
    <div className="space-y-8">
      <HubCollateralSyncCallout />
      <LendingActionPanel id="lending-panel-borrow" labelledBy="lending-tab-borrow">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="mb-1 font-headline text-2xl font-bold text-primary">Borrow USDC</h3>
            <p className="text-sm text-on-surface-variant">
              Access liquidity against your vaulted collateral.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-primary-container">
              Available to Borrow
            </span>
            <span className="font-headline text-3xl font-extrabold text-primary">
              ${Number(maxStr).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {!isConnected ? (
          <p className="text-sm text-on-surface-variant">Connect your wallet to borrow.</p>
        ) : !isHub ? (
          <p className="text-sm text-amber-800">Switch to {hubChain.name} to borrow.</p>
        ) : !poolAddr ? (
          <p className="text-sm text-on-surface-variant">Lending pool not configured.</p>
        ) : (
          <div className="space-y-8">
            <UsdcInputField
              label="Amount to Borrow"
              value={amount}
              onChange={setAmount}
              headerRight={
                <button
                  type="button"
                  onClick={() => setAmount(maxStr)}
                  className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary/20"
                >
                  Max
                </button>
              }
              tokenClassName="border border-outline-variant/30"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
                  Preview Health Factor
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-headline text-xl font-bold text-primary">
                    {amountWei > 0n ? formatHealthFactor(previewHf.data) : "—"}
                  </p>
                  <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                    LIVE PREVIEW
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Borrowing Fee</span>
                <p className="font-headline text-xl font-bold text-primary">—</p>
                <p className="text-xs text-on-surface-variant">See pool / governance parameters</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                disabled={!canBorrow || isPending}
                onClick={handleBorrow}
                className={`w-full rounded-xl py-5 text-lg font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 disabled:opacity-50 ${lendingGradientPrimary}`}
              >
                {isPending ? "Confirm in wallet…" : "Borrow USDC"}
              </button>
            </div>
          </div>
        )}
      </LendingActionPanel>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <h4 className="font-headline text-lg font-bold text-primary">Locked Collateral</h4>
          <Link to="/assets?scope=mine" className="text-sm font-semibold text-secondary hover:underline">
            Manage Assets
          </Link>
        </div>
        {topCollateral.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No collateral yet. Deposit NFTs from the Lock flow.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {topCollateral.map((c, i) => {
              const usd = collateralLatestUsdNumber(c);
              const title = collateralDisplayTitle(c);
              const tierId = c.card?.tier;
              const tier =
                tierId != null
                  ? PROTOCOL_TIER_ROWS.find((t) => t.tierId === tierId) ??
                    PROTOCOL_TIER_ROWS[i % PROTOCOL_TIER_ROWS.length]
                  : PROTOCOL_TIER_ROWS[i % PROTOCOL_TIER_ROWS.length];
              return (
                <TierCollateralCard
                  key={c.id}
                  layout="featured"
                  imageSrc={collateralDisplayImageUrl(c)}
                  imageAlt={title}
                  title={title}
                  subtitle={collateralDisplaySubtitle(c)}
                  tierLabel={tier.name}
                  tierBadgeClassName={i === 0 ? "bg-primary/90 backdrop-blur-md" : "bg-secondary/90 backdrop-blur-md"}
                  ltv={`${tier.ltvPercent}% max LTV`}
                  valuation={usd > 0 ? `$${formatUsdNumber(usd)}` : "—"}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
