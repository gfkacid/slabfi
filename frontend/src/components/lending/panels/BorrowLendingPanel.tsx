import { TierCollateralCard } from "@/components/shared/lending/TierCollateralCard";
import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import { LENDING_IMAGES } from "@/components/lending/lendingMockAssets";

export function BorrowLendingPanel() {
  return (
    <div className="space-y-8">
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
            <span className="font-headline text-3xl font-extrabold text-primary">$242,500.00</span>
          </div>
        </div>

        <div className="space-y-8">
          <UsdcInputField
            label="Amount to Borrow"
            headerRight={
              <button
                type="button"
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
                New Health Factor
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-headline text-xl font-bold text-primary">1.64</p>
                <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                  LIVE PREVIEW
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Borrowing Fee</span>
              <p className="font-headline text-xl font-bold text-primary">
                0.05% <span className="text-sm font-medium text-on-primary-container">($12.50)</span>
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              className={`w-full rounded-xl py-5 text-lg font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 ${lendingGradientPrimary}`}
            >
              Borrow USDC
            </button>
          </div>
        </div>
      </LendingActionPanel>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <h4 className="font-headline text-lg font-bold text-primary">Locked Collateral</h4>
          <button
            type="button"
            className="text-sm font-semibold text-secondary hover:underline"
          >
            Manage Assets
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TierCollateralCard
            layout="featured"
            imageSrc={LENDING_IMAGES.charizard1st}
            imageAlt=""
            title="Mewtwo GX"
            subtitle="PSA 10 Gem Mint"
            tierLabel="Blue Chip"
            tierBadgeClassName="bg-primary/90 backdrop-blur-md"
            ltv="40% LTV"
            valuation="$75,000.00 Val."
          />
          <TierCollateralCard
            layout="featured"
            imageSrc={LENDING_IMAGES.lugiaHolo}
            imageAlt=""
            title="Charizard VMAX"
            subtitle="Shiny Vault SV107"
            tierLabel="Growth"
            tierBadgeClassName="bg-secondary/90 backdrop-blur-md"
            ltv="25% LTV"
            valuation="$67,500.00 Val."
          />
        </div>
      </div>
    </div>
  );
}
