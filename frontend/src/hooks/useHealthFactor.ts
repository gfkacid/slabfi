import { useAccount, useReadContract, useChainId } from "wagmi";
import { HEALTH_FACTOR_ENGINE_ABI } from "@slabfinance/shared";
import { PositionStatus } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";

export { PositionStatus };

export function usePositionStatus() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.healthFactorEngine : undefined;

  return useReadContract({
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "getPositionStatus",
    args: address ? [address] : undefined,
  });
}

export function usePreviewHealthFactor(
  collateralValuesUSD: readonly bigint[] | undefined,
  tiers: readonly number[] | undefined,
  totalDebtUSD: bigint | undefined
) {
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.healthFactorEngine : undefined;
  const canCall =
    addr && collateralValuesUSD && tiers && totalDebtUSD !== undefined && totalDebtUSD >= 0n;

  return useReadContract({
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "previewHealthFactor",
    args: canCall ? [collateralValuesUSD, tiers, totalDebtUSD] : undefined,
  });
}
