import { useAccount, useChainId, useReadContract } from "wagmi";
import { ERC20_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";

export function useUsdcBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const usdc = chainId === hubChain.id ? hubContracts.usdc : undefined;

  return useReadContract({
    address: usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address && usdc ? [address] : undefined,
    query: { enabled: Boolean(usdc && address) },
  });
}

export function useUsdcDecimals() {
  const chainId = useChainId();
  const usdc = chainId === hubChain.id ? hubContracts.usdc : undefined;

  return useReadContract({
    address: usdc,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: Boolean(usdc) },
  });
}
