import { useWriteContract, useChainId } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { COLLATERAL_ADAPTER_ABI } from "@slabfinance/shared";
import { sepolia } from "@/lib/chains";
import { useQueryClient } from "@tanstack/react-query";

export function useLockAndNotify() {
  const chainId = useChainId();
  const addr =
    chainId === sepolia.id ? CONTRACT_ADDRESSES.sepolia.collateralAdapter : undefined;
  const queryClient = useQueryClient();

  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}
