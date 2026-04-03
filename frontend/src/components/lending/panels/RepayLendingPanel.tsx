import { useCallback, useRef, useState } from "react";
import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import { showToast } from "@/lib/toast";

const MOCK_REPAY_DELAY_MS = 1800;

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 animate-spin ${className}`.trim()}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function RepayLendingPanel() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingRef = useRef(false);

  const runMockRepay = useCallback(() => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setIsSubmitting(true);

    window.setTimeout(() => {
      pendingRef.current = false;
      setIsSubmitting(false);

      const ok = Math.random() < 0.5;
      if (ok) {
        showToast({
          type: "success",
          title: "Repayment confirmed",
          message:
            "Your USDC repayment was confirmed on-chain. Your debt and health factor will update shortly.",
        });
      } else {
        showToast({
          type: "error",
          title: "Repayment failed",
          message:
            "The network could not confirm your transaction. Check your wallet balance and RPC connection, then try again.",
          tag: "RPC",
          actions: [{ label: "Try again", onClick: () => runMockRepay() }],
        });
      }
    }, MOCK_REPAY_DELAY_MS);
  }, []);

  return (
    <LendingActionPanel id="lending-panel-repay" labelledBy="lending-tab-repay">
      <div className="mb-10">
        <h3 className="mb-1 font-headline text-2xl font-bold text-primary">Repay Debt</h3>
        <p className="text-sm text-on-surface-variant">
          Settle your outstanding borrow position to improve your health factor.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Principal
          </span>
          <p className="font-headline text-lg font-bold text-primary">
            12,450.00 <span className="text-xs font-medium opacity-60">USDC</span>
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Accrued Interest
          </span>
          <p className="font-headline text-lg font-bold text-primary">
            42.85 <span className="text-xs font-medium opacity-60">USDC</span>
          </p>
        </div>
        <div className="rounded-xl border border-secondary/20 bg-surface-container-high p-4">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-secondary">
            Total Debt
          </span>
          <p className="font-headline text-lg font-extrabold text-primary">
            12,492.85 <span className="text-xs font-medium opacity-60">USDC</span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <UsdcInputField
          label="Amount to Repay"
          headerRight={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs font-medium text-on-surface-variant">
                Wallet Balance: <span className="font-bold text-primary">24,502.10 USDC</span>
              </span>
              <button
                type="button"
                className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20"
              >
                MAX
              </button>
            </div>
          }
        />

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => runMockRepay()}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 disabled:pointer-events-none disabled:opacity-70 ${lendingGradientPrimary}`}
        >
          {isSubmitting ? (
            <>
              <Spinner className="text-on-primary" />
              Confirming repayment…
            </>
          ) : (
            "Repay USDC"
          )}
        </button>
      </div>
    </LendingActionPanel>
  );
}
