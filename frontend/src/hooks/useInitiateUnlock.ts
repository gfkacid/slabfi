import { useWriteContract, useChainId } from "wagmi";
import { COLLATERAL_REGISTRY_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";
import { useQueryClient } from "@tanstack/react-query";

export function useInitiateUnlock() {
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.collateralRegistry : undefined;
  const queryClient = useQueryClient();

  return useWriteContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    },
  });
}
