import { useAccount, useReadContract, useChainId } from "wagmi";
import { COLLATERAL_REGISTRY_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";

export function useAvailableCredit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.collateralRegistry : undefined;

  return useReadContract({
    address: addr,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "availableCredit",
    args: address ? [address] : undefined,
  });
}

export function usePosition() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.collateralRegistry : undefined;

  return useReadContract({
    address: addr,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "getPosition",
    args: address ? [address] : undefined,
  });
}

export function useCollateralItem(collateralId: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.collateralRegistry : undefined;

  return useReadContract({
    address: addr,
    abi: COLLATERAL_REGISTRY_ABI,
    functionName: "getCollateralItem",
    args: collateralId ? [collateralId] : undefined,
  });
}
