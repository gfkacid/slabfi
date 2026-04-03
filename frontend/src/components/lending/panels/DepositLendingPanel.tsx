import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";

export function DepositLendingPanel() {
  return (
    <div>
      <LendingActionPanel id="lending-panel-deposit" labelledBy="lending-tab-deposit">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="mb-1 font-headline text-2xl font-bold text-primary">Deposit USDC</h3>
            <p className="text-sm text-on-surface-variant">
              Supply liquidity to the vault and earn architectural yield.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-primary-container">
              Current Supply APR
            </span>
            <span className="font-headline text-3xl font-extrabold text-emerald-600">8.42%</span>
          </div>
        </div>

        <div className="space-y-6">
          <UsdcInputField
            label="Amount to Deposit"
            headerRight={
              <span className="text-xs font-medium text-on-surface-variant">
                Wallet Balance: <span className="font-bold text-primary">24,502.10 USDC</span>
              </span>
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-surface-container-low p-5">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
                Vault Shares Expected
              </span>
              <p className="font-headline text-lg font-bold text-primary">
                0.00 <span className="text-sm font-medium text-on-primary-container">vUSDC</span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-5">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
                Next Epoch Yield
              </span>
              <p className="font-headline text-lg font-bold text-emerald-600">
                +$142.20 <span className="text-sm font-medium text-on-primary-container">Est.</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-xl bg-surface-container-high py-4 font-bold text-primary transition-all hover:bg-surface-container-highest active:opacity-80"
            >
              Approve USDC
            </button>
            <button
              type="button"
              className={`flex-[1.5] rounded-xl py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 ${lendingGradientPrimary}`}
            >
              Deposit into Vault
            </button>
          </div>
        </div>
      </LendingActionPanel>
    </div>
  );
}
