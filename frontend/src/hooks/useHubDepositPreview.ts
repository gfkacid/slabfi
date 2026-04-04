import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import {
  COLLATERAL_REGISTRY_ABI,
  LENDING_POOL_ABI,
  ORACLE_CONSUMER_ABI,
  HEALTH_FACTOR_ENGINE_ABI,
} from "@slabfinance/shared";
import { CollateralStatus } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";

export type HubExistingCollateralSlice = {
  /** Oracle USD prices with 8 decimals (same as `OracleConsumer.getPrice`). */
  valuesPrice8: bigint[];
  tiers: readonly number[];
};

/**
 * Loads active hub collateral (on-chain price 8 decimals) + tiers for `previewHealthFactor`.
 * `previewHealthFactor` expects 8-dec prices and total debt in raw USDC (6 decimals).
 */
export function useHubExistingCollateral(enabled: boolean) {
  const { address } = useAccount();
  const hubClient = usePublicClient({ chainId: hubChain.id });
  const reg = hubContracts.collateralRegistry;
  const oracle = hubContracts.oracleConsumer;

  return useQuery({
    queryKey: ["hub-existing-collateral", hubChain.id, address, reg, oracle],
    enabled: enabled && !!address && !!hubClient && !!reg && !!oracle,
    queryFn: async (): Promise<HubExistingCollateralSlice> => {
      if (!address || !hubClient || !reg || !oracle) {
        return { valuesPrice8: [], tiers: [] };
      }

      const position = await hubClient.readContract({
        address: reg,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "getPosition",
        args: [address],
      });

      const valuesPrice8: bigint[] = [];
      const tiers: number[] = [];

      for (const cid of position.collateralIds) {
        const item = await hubClient.readContract({
          address: reg,
          abi: COLLATERAL_REGISTRY_ABI,
          functionName: "getCollateralItem",
          args: [cid],
        });
        if (item.status !== CollateralStatus.ACTIVE) continue;

        try {
          const [price8] = await hubClient.readContract({
            address: oracle,
            abi: ORACLE_CONSUMER_ABI,
            functionName: "getPrice",
            args: [item.collection, item.tokenId],
          });
          const tier = await hubClient.readContract({
            address: oracle,
            abi: ORACLE_CONSUMER_ABI,
            functionName: "tokenTier",
            args: [item.collection, item.tokenId],
          });
          const t = Number(tier);
          valuesPrice8.push(price8);
          tiers.push(t >= 1 && t <= 3 ? t : 1);
        } catch {
          // no on-chain price yet
        }
      }

      return { valuesPrice8, tiers };
    },
  });
}

export function useHubOutstandingTotal(enabled: boolean) {
  const { address } = useAccount();
  const pool = hubContracts.lendingPool;

  return useReadContract({
    chainId: hubChain.id,
    address: enabled && pool ? pool : undefined,
    abi: LENDING_POOL_ABI,
    functionName: "outstandingDebt",
    args: enabled && address && pool ? [address] : undefined,
  });
}

export function usePreviewHealthFactorOnHub(
  collateralValuesPrice8: readonly bigint[] | undefined,
  tiers: readonly number[] | undefined,
  totalDebtRaw: bigint | undefined,
  enabled: boolean
) {
  const addr = hubContracts.healthFactorEngine;

  const canCall =
    enabled &&
    !!addr &&
    collateralValuesPrice8 !== undefined &&
    tiers !== undefined &&
    totalDebtRaw !== undefined &&
    collateralValuesPrice8.length === tiers.length;

  return useReadContract({
    chainId: hubChain.id,
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "previewHealthFactor",
    args: canCall ? [collateralValuesPrice8, tiers as readonly number[], totalDebtRaw] : undefined,
  });
}

const MAX_UINT256 = 2n ** 256n - 1n;

export function formatHealthFactor(hf: bigint | undefined): string {
  if (hf === undefined) return "—";
  if (hf === MAX_UINT256) return "∞";
  const x = Number(hf) / 1e18;
  if (!Number.isFinite(x)) return "—";
  return x.toFixed(2);
}
