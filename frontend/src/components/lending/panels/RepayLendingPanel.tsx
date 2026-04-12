import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { LENDING_POOL_ABI, ERC20_ABI, HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import { useOutstandingDebt, useRepay, useUsdcBalance } from "@/hooks";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import { formatUsdc } from "@/lib/hubFormat";

export function RepayLendingPanel() {
  const { isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  const { data: debt } = useOutstandingDebt();
  const { data: walletBal } = useUsdcBalance();
  const { writeContractAsync, isPending } = useRepay();

  const poolAddr = hubContracts.lendingPool;
  const usdcAddr = hubContracts.usdc;
  const isHub = isHubEvm(chainId);

  const principal = debt?.[0] ?? 0n;
  const interest = debt?.[1] ?? 0n;
  const totalDebt = principal + interest;
  const totalFormatted = Number(formatUnits(totalDebt, HUB_USDC_DECIMALS));

  const amountWei = useMemo(() => {
    try {
      if (!amount || amount === ".") return 0n;
      return parseUnits(amount, HUB_USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount]);

  const walletStr = walletBal !== undefined ? formatUsdc(walletBal) : "0.00";

  const canRepay =
    isHub &&
    poolAddr &&
    usdcAddr &&
    amountWei > 0n &&
    amountWei <= totalDebt;

  const handleRepay = async () => {
    if (!canRepay || !poolAddr || !usdcAddr) return;
    try {
      await writeContractAsync({
        address: usdcAddr,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddr, amountWei],
      });
      await writeContractAsync({
        address: poolAddr,
        abi: LENDING_POOL_ABI,
        functionName: "repay",
        args: [amountWei],
      });
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LendingActionPanel id="lending-panel-repay" labelledBy="lending-tab-repay">
      <div className="mb-10">
        <h3 className="mb-1 font-headline text-2xl font-bold text-primary">Repay Debt</h3>
        <p className="text-sm text-on-surface-variant">
          Settle your outstanding borrow position to improve your health factor.
        </p>
      </div>

      {!isConnected ? (
        <p className="text-sm text-on-surface-variant">Connect your wallet to repay.</p>
      ) : !isHub ? (
        <p className="text-sm text-amber-800">Switch to {hubChain.name} to repay.</p>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Principal
              </span>
              <p className="font-headline text-lg font-bold text-primary">
                {Number(formatUnits(principal, HUB_USDC_DECIMALS)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium opacity-60">USDC</span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Accrued Interest
              </span>
              <p className="font-headline text-lg font-bold text-primary">
                {Number(formatUnits(interest, HUB_USDC_DECIMALS)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}{" "}
                <span className="text-xs font-medium opacity-60">USDC</span>
              </p>
            </div>
            <div className="rounded-xl border border-secondary/20 bg-surface-container-high p-4">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-secondary">
                Total Debt
              </span>
              <p className="font-headline text-lg font-extrabold text-primary">
                {totalFormatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-medium opacity-60">USDC</span>
              </p>
            </div>
          </div>

          {totalDebt > 0n ? (
            <div className="space-y-6">
              <UsdcInputField
                label="Amount to Repay"
                value={amount}
                onChange={setAmount}
                headerRight={
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <span className="text-xs font-medium text-on-surface-variant">
                      Wallet Balance:{" "}
                      <span className="font-bold text-primary">
                        {walletStr} USDC
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmount(totalFormatted.toString())}
                      className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      MAX
                    </button>
                  </div>
                }
              />

              <button
                type="button"
                disabled={!canRepay || isPending}
                onClick={handleRepay}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 disabled:opacity-50 ${lendingGradientPrimary}`}
              >
                {isPending ? "Confirm in wallet…" : "Repay USDC"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No debt to repay.</p>
          )}
        </>
      )}
    </LendingActionPanel>
  );
}
