import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useChainId, useReadContracts, useWriteContract } from "wagmi";
import { COLLATERAL_REGISTRY_ABI, HEALTH_FACTOR_ENGINE_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";
import { usePosition } from "./useCollateralRegistry";

/** Matches `CollateralStatus.PENDING` on-chain (see COLLATERAL_STATUS_LABELS). */
const COLLATERAL_PENDING = 0;

export type HubPendingCollateralDetail = {
  collateralId: `0x${string}`;
  collection: `0x${string}`;
  tokenId: bigint;
};

type CollateralItemDecoded = {
  status?: number;
  collection?: `0x${string}`;
  tokenId?: bigint;
};

export function useHubPendingCollateralIds() {
  const chainId = useChainId();
  const { data: position } = usePosition();
  const registry =
    chainId === hubChain.id && hubContracts.collateralRegistry
      ? hubContracts.collateralRegistry
      : undefined;
  const ids = position?.collateralIds ?? [];

  const { data: rows, isLoading, isFetching } = useReadContracts({
    contracts:
      registry && ids.length > 0
        ? ids.map((id) => ({
            address: registry,
            abi: COLLATERAL_REGISTRY_ABI,
            functionName: "getCollateralItem",
            args: [id],
          }))
        : [],
    query: {
      enabled: Boolean(registry && ids.length > 0),
    },
  });

  const pendingIds: `0x${string}`[] = [];
  let firstPendingDetail: HubPendingCollateralDetail | null = null;
  if (rows) {
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i]?.result as CollateralItemDecoded | undefined;
      if (item?.status !== COLLATERAL_PENDING) continue;
      pendingIds.push(ids[i]!);
      if (!firstPendingDetail && item.collection && item.tokenId !== undefined) {
        firstPendingDetail = {
          collateralId: ids[i]!,
          collection: item.collection,
          tokenId: item.tokenId,
        };
      }
    }
  }

  return {
    hasPendingCollateral: pendingIds.length > 0,
    pendingIds,
    firstPendingDetail,
    isLoading: isLoading || isFetching,
  };
}

function useRecomputeHubPosition() {
  const queryClient = useQueryClient();
  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}

/** Runs `HealthFactorEngine.recomputePosition` for the connected wallet (activates PENDING when oracle succeeds). */
export function useSyncHubCollateralForBorrow() {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error } = useRecomputeHubPosition();

  const sync = async () => {
    const engine = hubContracts.healthFactorEngine;
    if (!address || !engine) return;
    await writeContractAsync({
      address: engine,
      abi: HEALTH_FACTOR_ENGINE_ABI,
      functionName: "recomputePosition",
      args: [address],
    });
  };

  return { sync, isPending, error };
}
