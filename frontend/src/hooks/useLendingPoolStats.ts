import { useAccount, useChainId, useReadContract } from "wagmi";
import { LENDING_POOL_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";

/** On-chain lending pool metrics on the hub (for connected wallet: also share balance). */
export function useLendingPoolStats() {
  const chainId = useChainId();
  const { address } = useAccount();
  const pool = chainId === hubChain.id ? hubContracts.lendingPool : undefined;
  const enabled = Boolean(pool);

  const q = { enabled } as const;

  const ta = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "totalAssets",
    query: q,
  });
  const al = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "availableLiquidity",
    query: q,
  });
  const ut = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "utilization",
    query: q,
  });
  const sup = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "currentSupplyAPR",
    query: q,
  });
  const br = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "currentBorrowAPR",
    query: q,
  });
  const ex = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "exchangeRate",
    query: q,
  });
  const tss = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "totalSupplyShares",
    query: q,
  });

  const { data: balanceOfShares, ...sharesRest } = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "balanceOfShares",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(pool && address) },
  });

  const previewWithdraw = useReadContract({
    address: pool,
    abi: LENDING_POOL_ABI,
    functionName: "previewWithdraw",
    args: balanceOfShares !== undefined ? [balanceOfShares] : undefined,
    query: { enabled: Boolean(pool && address && balanceOfShares !== undefined) },
  });

  const reads = [ta, al, ut, sup, br, ex, tss, previewWithdraw];
  const isLoading = reads.some((r) => r.isLoading) || sharesRest.isLoading;
  const isFetching = reads.some((r) => r.isFetching) || sharesRest.isFetching;
  const isError = reads.some((r) => r.isError) || sharesRest.isError;

  return {
    isLoading,
    isFetching,
    isError,
    refetch: () => Promise.all([...reads.map((r) => r.refetch()), sharesRest.refetch()]),
    poolAddress: pool,
    totalAssets: ta.data as bigint | undefined,
    availableLiquidity: al.data as bigint | undefined,
    utilizationWad: ut.data as bigint | undefined,
    supplyAprBps: sup.data as bigint | undefined,
    borrowAprBps: br.data as bigint | undefined,
    exchangeRateWad: ex.data as bigint | undefined,
    totalSupplyShares: tss.data as bigint | undefined,
    balanceOfShares,
    /** USDC (6 decimals) redeemable for the wallet's share balance; 0n when shares are 0. */
    supplyAssetsUsdc: previewWithdraw.data as bigint | undefined,
  };
}
