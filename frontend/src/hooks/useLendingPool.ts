import { useAccount, useReadContract, useWriteContract, useChainId } from "wagmi";
import { LENDING_POOL_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";
import { useQueryClient } from "@tanstack/react-query";

export function useOutstandingDebt() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.lendingPool : undefined;

  return useReadContract({
    address: addr,
    abi: LENDING_POOL_ABI,
    functionName: "outstandingDebt",
    args: address ? [address] : undefined,
  });
}

/** LP-facing vault size: idle USDC + outstanding borrows − protocol reserves (view-accrues). */
export function useTotalAssets() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.lendingPool : undefined;

  return useReadContract({
    address: addr,
    abi: LENDING_POOL_ABI,
    functionName: "totalAssets",
  });
}

export function useBorrow() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.lendingPool : undefined;
  const queryClient = useQueryClient();

  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}

export function useRepay() {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.lendingPool : undefined;
  const queryClient = useQueryClient();

  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}

export function useDeposit() {
  return useWriteContract();
}
