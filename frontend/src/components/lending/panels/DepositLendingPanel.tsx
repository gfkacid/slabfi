import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { LENDING_POOL_ABI, ERC20_ABI, HUB_USDC_DECIMALS } from "@slabfinance/shared";
import { UsdcInputField } from "@/components/shared/lending/UsdcInputField";
import { LendingActionPanel } from "@/components/shared/lending/LendingActionPanel";
import { lendingGradientPrimary } from "@/components/shared/lending/lendingStyles";
import { useDeposit, useLendingPoolStats, useUsdcBalance } from "@/hooks";
import { hubChain, hubContracts } from "@/lib/hub";
import { aprPercentFromBps, formatUsdc } from "@/lib/hubFormat";
import { useReadContract } from "wagmi";

export function DepositLendingPanel() {
  const { isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  const { writeContractAsync, isPending } = useDeposit();
  const poolStats = useLendingPoolStats();
  const { data: walletBal } = useUsdcBalance();

  const poolAddr = hubContracts.lendingPool;
  const usdcAddr = hubContracts.usdc;
  const isHub = chainId === hubChain.id;

  const amountWei = useMemo(() => {
    try {
      if (!amount || amount === ".") return 0n;
      return parseUnits(amount, HUB_USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount]);

  const { data: previewShares } = useReadContract({
    address: poolAddr,
    abi: LENDING_POOL_ABI,
    functionName: "previewDeposit",
    args: amountWei > 0n ? [amountWei] : undefined,
    query: { enabled: Boolean(poolAddr && isHub && amountWei > 0n) },
  });

  const walletStr =
    walletBal !== undefined ? formatUsdc(walletBal) : "—";
  const sharesStr =
    previewShares !== undefined && amountWei > 0n
      ? formatUnits(previewShares, HUB_USDC_DECIMALS)
      : "0.00";
  const supplyApr = aprPercentFromBps(poolStats.supplyAprBps);
  const estYieldUsd =
    amountWei > 0n && poolStats.supplyAprBps !== undefined
      ? (Number(formatUnits(amountWei, HUB_USDC_DECIMALS)) * Number(poolStats.supplyAprBps)) / 10000
      : 0;

  const canSubmit =
    isHub &&
    poolAddr &&
    usdcAddr &&
    amountWei > 0n &&
    (walletBal === undefined || amountWei <= walletBal);

  const handleDeposit = async () => {
    if (!canSubmit || !poolAddr || !usdcAddr) return;
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
        functionName: "deposit",
        args: [amountWei],
      });
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <LendingActionPanel id="lending-panel-deposit" labelledBy="lending-tab-deposit">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="mb-1 font-headline text-2xl font-bold text-primary">Deposit USDC</h3>
            <p className="text-sm text-on-surface-variant">
              Supply liquidity to the vault and earn yield.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-primary-container">
              Current Supply APR
            </span>
            <span className="font-headline text-3xl font-extrabold text-emerald-600">
              {supplyApr}%
            </span>
          </div>
        </div>

        {!isConnected ? (
          <p className="text-sm text-on-surface-variant">Connect your wallet to deposit.</p>
        ) : !isHub ? (
          <p className="text-sm text-amber-800">Switch to {hubChain.name} to deposit.</p>
        ) : !poolAddr ? (
          <p className="text-sm text-on-surface-variant">Lending pool address not configured.</p>
        ) : (
          <div className="space-y-6">
            <UsdcInputField
              label="Amount to Deposit"
              value={amount}
              onChange={setAmount}
              headerRight={
                <span className="text-xs font-medium text-on-surface-variant">
                  Wallet Balance: <span className="font-bold text-primary">{walletStr} USDC</span>
                </span>
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-container-low p-5">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
                  Vault Shares Expected
                </span>
                <p className="font-headline text-lg font-bold text-primary">
                  {parseFloat(sharesStr).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                  <span className="text-sm font-medium text-on-primary-container">vUSDC</span>
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-5">
                <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
                  Est. annual yield (APR × amount)
                </span>
                <p className="font-headline text-lg font-bold text-emerald-600">
                  +$
                  {estYieldUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                  <span className="text-sm font-medium text-on-primary-container">Est.</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                type="button"
                disabled={!canSubmit || isPending}
                onClick={handleDeposit}
                className={`flex-[1.5] rounded-xl py-4 font-bold text-on-primary shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:opacity-80 disabled:opacity-50 ${lendingGradientPrimary}`}
              >
                {isPending ? "Confirm in wallet…" : "Approve & deposit"}
              </button>
            </div>
          </div>
        )}
      </LendingActionPanel>
    </div>
  );
}
