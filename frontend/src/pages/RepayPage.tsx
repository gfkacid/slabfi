import { useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { LENDING_POOL_ABI, COLLATERAL_REGISTRY_ABI, ERC20_ABI } from "@slabfinance/shared";
import { useOutstandingDebt, useRepay, usePosition, useInitiateUnlock } from "@/hooks";
import { AmountInput } from "@/components/AmountInput";
import { TransactionButton } from "@/components/TransactionButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { hubChain, hubContracts } from "@/lib/hub";

export function RepayPage() {
  const { isConnected, chainId } = useAccount();
  const { data: debt } = useOutstandingDebt();
  const { data: position } = usePosition();
  const { writeContractAsync: repayAsync, isPending: repayPending } = useRepay();
  const { writeContractAsync: unlockAsync, isPending: unlockPending } = useInitiateUnlock();

  const [amount, setAmount] = useState("");

  const isHubChain = chainId === hubChain.id;
  const poolAddr = hubContracts.lendingPool;
  const registryAddr = hubContracts.collateralRegistry;
  const usdcAddr = hubContracts.usdc;

  const principal = debt?.[0] ?? 0n;
  const interest = debt?.[1] ?? 0n;
  const totalDebt = principal + interest;
  const totalFormatted = Number(formatUnits(totalDebt, 18));
  const amountWei = (() => {
    try {
      if (!amount || amount === ".") return 0n;
      return parseUnits(amount, 18);
    } catch {
      return 0n;
    }
  })();

  const hasDebt = totalDebt > 0n;
  const canRepay = amountWei > 0n && amountWei <= totalDebt && poolAddr && usdcAddr;
  const canUnlock = !hasDebt && position?.collateralIds?.length && registryAddr;

  const handleRepay = async () => {
    if (!canRepay || !poolAddr || !usdcAddr) return;

    try {
      await repayAsync({
        address: usdcAddr,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddr, amountWei],
      });
      await repayAsync({
        address: poolAddr,
        abi: LENDING_POOL_ABI,
        functionName: "repay",
        args: [amountWei],
      });
      setAmount("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiateUnlock = async () => {
    if (!canUnlock || !position?.collateralIds?.length || !registryAddr) return;
    const collateralId = position.collateralIds[0] as `0x${string}`;

    try {
      await unlockAsync({
        address: registryAddr,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "initiateUnlock",
        args: [collateralId],
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Repay" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">Connect your wallet to repay.</p>
        </Card>
      </div>
    );
  }

  if (!isHubChain) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Repay" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">Switch to {hubChain.name} to repay.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Repay"
        description="Repay your USDC debt. After full repayment, you can initiate unlock to retrieve your collateral on Ethereum Sepolia."
      />

      <Card variant="elevated" className="mb-8">
        <h2 className="mb-4 font-headline text-lg font-semibold text-primary">Debt breakdown</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Principal</span>
            <span className="text-on-surface">${Number(formatUnits(principal, 18)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Interest</span>
            <span className="text-on-surface">${Number(formatUnits(interest, 18)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-outline-variant/20 pt-2 font-semibold text-primary">
            <span>Total</span>
            <span>${totalFormatted.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {hasDebt && (
        <>
          <div className="mb-6">
            <AmountInput
              value={amount}
              onChange={setAmount}
              max={totalFormatted.toString()}
              onMaxClick={() => setAmount(totalFormatted.toString())}
              label="Repay amount"
            />
          </div>
          <TransactionButton
            onClick={handleRepay}
            isLoading={repayPending}
            disabled={!canRepay}
          >
            Repay USDC
          </TransactionButton>
        </>
      )}

      {canUnlock && (
        <div className="mt-8">
          <p className="mb-4 text-on-surface-variant">
            Your debt is fully repaid. Unlock your collateral.
          </p>
          <TransactionButton
            onClick={handleInitiateUnlock}
            isLoading={unlockPending}
            variant="secondary"
          >
            Initiate Unlock
          </TransactionButton>
        </div>
      )}

      {!hasDebt && !canUnlock && (
        <p className="text-on-surface-variant">No debt to repay.</p>
      )}
    </div>
  );
}
