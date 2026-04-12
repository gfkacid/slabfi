import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract, useChainId, usePublicClient } from "wagmi";
import type { Address } from "viem";
import { isAddress } from "viem";
import { HEALTH_FACTOR_ENGINE_ABI } from "@slabfinance/shared";
import { PositionStatus } from "@slabfinance/shared";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import { computeHubHealthFactorWad } from "@/lib/computeHubHealthFactorWad";

export { PositionStatus };

export function usePositionStatus() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.healthFactorEngine : undefined;

  return useReadContract({
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "getPositionStatus",
    args: address ? [address] : undefined,
  });
}

/**
 * Health factor (WAD) on the hub: prefers a single `getHealthFactor` call when the
 * deployed engine supports it; otherwise recomputes the same value as on-chain via
 * registry + oracle + pool reads (no contract upgrade required).
 */
export function useHealthFactorWad() {
  const { address } = useAccount();
  const chainId = useChainId();
  const client = usePublicClient({ chainId: hubChain.id });
  const onHub = isHubEvm(chainId);

  const engine = hubContracts.healthFactorEngine;
  const reg = hubContracts.collateralRegistry;
  const oracle = hubContracts.oracleConsumer;
  const pool = hubContracts.lendingPool;

  const engineAddr: Address | undefined =
    onHub && engine && isAddress(engine) && engine !== "0x0000000000000000000000000000000000000000"
      ? engine
      : undefined;

  const q = useQuery({
    queryKey: ["health-factor-wad", hubChain.id, address, engineAddr, reg, oracle, pool],
    enabled: Boolean(onHub && address && client && reg && oracle && pool),
    staleTime: 10_000,
    queryFn: async (): Promise<bigint> => {
      if (engineAddr) {
        try {
          return await client!.readContract({
            address: engineAddr,
            abi: HEALTH_FACTOR_ENGINE_ABI,
            functionName: "getHealthFactor",
            args: [address as Address],
          });
        } catch {
          /* Engine predates `getHealthFactor`, or transient RPC failure — fall back. */
        }
      }
      return computeHubHealthFactorWad({
        client: client!,
        borrower: address as Address,
        collateralRegistry: reg as Address,
        oracleConsumer: oracle as Address,
        lendingPool: pool as Address,
      });
    },
  });

  return {
    data: q.data,
    isError: q.isError,
    isLoading: q.isPending,
    isPending: q.isPending,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
}

export function usePreviewHealthFactor(
  collateralValuesUSD: readonly bigint[] | undefined,
  tiers: readonly number[] | undefined,
  totalDebtUSD: bigint | undefined
) {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.healthFactorEngine : undefined;
  const canCall =
    addr && collateralValuesUSD && tiers && totalDebtUSD !== undefined && totalDebtUSD >= 0n;

  return useReadContract({
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "previewHealthFactor",
    args: canCall ? [collateralValuesUSD, tiers, totalDebtUSD] : undefined,
  });
}
