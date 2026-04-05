import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { HUB_USDC_DECIMALS, LENDING_POOL_ABI } from "@slabfinance/shared";
import { useAvailableCredit, useBorrow } from "@/hooks";
import { AmountInput } from "@/components/AmountInput";
import { TransactionButton } from "@/components/TransactionButton";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { HubCollateralSyncCallout } from "@/components/shared/lending/HubCollateralSyncCallout";
import { hubChain, hubContracts } from "@/lib/hub";

export function BorrowPage() {
  const { isConnected, chainId } = useAccount();
  const { data: availableCredit } = useAvailableCredit();
  const { writeContractAsync, isPending } = useBorrow();

  const [amount, setAmount] = useState("");

  const isHubChain = chainId === hubChain.id;
  const maxBorrow = availableCredit ?? 0n;
  const amountWei = useMemo(() => {
    try {
      if (!amount || amount === ".") return 0n;
      return parseUnits(amount, HUB_USDC_DECIMALS);
    } catch {
      return 0n;
    }
  }, [amount]);

  const handleBorrow = async () => {
    if (amountWei <= 0n || amountWei > maxBorrow) return;

    const poolAddr = hubContracts.lendingPool;
    if (!poolAddr) return;

    try {
      await writeContractAsync({
        address: poolAddr,
        abi: LENDING_POOL_ABI,
        functionName: "borrow",
        args: [amountWei],
      });
      setAmount("");
    } catch (err) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Borrow" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">Connect your wallet to borrow.</p>
        </Card>
      </div>
    );
  }

  if (!isHubChain) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Borrow" />
        <Card variant="muted" className="border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm font-medium text-amber-900">
            Switch to {hubChain.name} to borrow.
          </p>
        </Card>
      </div>
    );
  }

  const maxFormatted = Number(formatUnits(maxBorrow, HUB_USDC_DECIMALS));
  const canBorrow = amountWei > 0n && amountWei <= maxBorrow;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Borrow"
        description="Borrow USDC against your locked collateral. Your borrow amount is capped by your available credit."
      />

      <HubCollateralSyncCallout className="mb-6" />

      <Card variant="elevated" className="mb-6">
        <p className="mb-2 text-sm text-on-surface-variant">Available to borrow</p>
        <p className="font-headline text-2xl font-bold text-primary">
          ${maxFormatted.toFixed(2)} USDC
        </p>
      </Card>

      <div className="mb-6">
        <AmountInput
          value={amount}
          onChange={setAmount}
          max={maxFormatted.toString()}
          onMaxClick={() => setAmount(maxFormatted.toString())}
          label="Borrow amount"
        />
      </div>

      <TransactionButton onClick={handleBorrow} isLoading={isPending} disabled={!canBorrow}>
        Borrow USDC
      </TransactionButton>
    </div>
  );
}
