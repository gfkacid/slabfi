import { useMemo } from "react";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useChainId,
} from "wagmi";
import { LIQUIDATION_MANAGER_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import { useQueryClient } from "@tanstack/react-query";
import { keccak256, encodePacked, type Hex } from "viem";
import type { AuctionRow } from "@/components/liquidation/ActiveQueueTableRow";

export function useMinBidIncrementBPS() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.liquidationManager : undefined;

  return useReadContract({
    address: addr,
    abi: LIQUIDATION_MANAGER_ABI,
    functionName: "minBidIncrementBPS",
    query: { enabled: Boolean(addr) },
  });
}

export function useActiveAuctionIds() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.liquidationManager : undefined;

  return useReadContract({
    address: addr,
    abi: LIQUIDATION_MANAGER_ABI,
    functionName: "activeAuctionIds",
    query: { enabled: Boolean(addr) },
  });
}

/** Resolves active auction IDs to full `AuctionRow` structs. */
export function useActiveAuctionRows() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.liquidationManager : undefined;
  const { data: ids, ...rest } = useActiveAuctionIds();

  const contracts = useMemo(
    () =>
      (ids ?? []).map((id) => ({
        address: addr!,
        abi: LIQUIDATION_MANAGER_ABI,
        functionName: "auctions" as const,
        args: [id as Hex],
      })),
    [ids, addr],
  );

  const { data: details, isLoading: detailsLoading } = useReadContracts({
    contracts,
    query: { enabled: Boolean(addr && ids && ids.length > 0) },
  });

  const rows: AuctionRow[] = useMemo(() => {
    if (!ids?.length || !details?.length) return [];
    const out: AuctionRow[] = [];
    for (let i = 0; i < ids.length; i++) {
      const r = details[i]?.result;
      if (!r || typeof r !== "object") continue;
      const t = r as {
        borrower: `0x${string}`;
        collateralId: `0x${string}`;
        startedAt: bigint;
        deadline: bigint;
        reservePrice: bigint;
        debtShareSnapshot: bigint;
        feeSnapshot: bigint;
        highestBid: bigint;
        highestBidder: `0x${string}`;
        settled: boolean;
        cancelled: boolean;
      };
      if (t.settled || t.cancelled) continue;
      out.push({
        auctionId: ids[i] as Hex,
        borrower: t.borrower,
        collateralId: t.collateralId,
        startedAt: t.startedAt,
        deadline: t.deadline,
        reservePrice: t.reservePrice,
        debtShareSnapshot: t.debtShareSnapshot,
        feeSnapshot: t.feeSnapshot,
        highestBid: t.highestBid,
        highestBidder: t.highestBidder,
        settled: t.settled,
        cancelled: t.cancelled,
      });
    }
    return out;
  }, [ids, details]);

  return {
    ...rest,
    data: rows,
    isLoading: rest.isLoading || Boolean(ids?.length && detailsLoading),
  };
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}

export function useClaimAuction() {
  const queryClient = useQueryClient();
  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}

/** @deprecated Prefer `auctionId` from `AuctionRow`; kept for compatibility. */
export function computeLiquidationId(
  borrower: `0x${string}`,
  collateralId: `0x${string}`,
): `0x${string}` {
  return keccak256(encodePacked(["address", "bytes32"], [borrower, collateralId]));
}
