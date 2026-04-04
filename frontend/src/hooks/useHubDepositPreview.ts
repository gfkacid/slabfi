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

const PRICE8_TO_WAD = 10n ** 10n;

export type HubExistingCollateralSlice = {
  valuesWad: bigint[];
  tiers: readonly number[];
};

/**
 * Loads active hub collateral (price 8 decimals → WAD) + tiers for `previewHealthFactor`.
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
        return { valuesWad: [], tiers: [] };
      }

      const position = await hubClient.readContract({
        address: reg,
        abi: COLLATERAL_REGISTRY_ABI,
        functionName: "getPosition",
        args: [address],
      });

      const valuesWad: bigint[] = [];
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
          valuesWad.push(price8 * PRICE8_TO_WAD);
          tiers.push(t >= 1 && t <= 3 ? t : 1);
        } catch {
          // no on-chain price yet
        }
      }

      return { valuesWad, tiers };
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
  collateralValuesWad: readonly bigint[] | undefined,
  tiers: readonly number[] | undefined,
  totalDebtWad: bigint | undefined,
  enabled: boolean
) {
  const addr = hubContracts.healthFactorEngine;

  const canCall =
    enabled &&
    !!addr &&
    collateralValuesWad !== undefined &&
    tiers !== undefined &&
    totalDebtWad !== undefined &&
    collateralValuesWad.length === tiers.length;

  return useReadContract({
    chainId: hubChain.id,
    address: addr,
    abi: HEALTH_FACTOR_ENGINE_ABI,
    functionName: "previewHealthFactor",
    args: canCall ? [collateralValuesWad, tiers as readonly number[], totalDebtWad] : undefined,
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
