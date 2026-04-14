import { useReadContract, useChainId } from "wagmi";
import { ORACLE_CONSUMER_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts, isHubEvm } from "@/lib/hub";

export function useOraclePrice(collection: `0x${string}` | undefined, tokenId: bigint | undefined) {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "getPrice",
    args: collection !== undefined && tokenId !== undefined ? [collection, tokenId] : undefined,
  });
}

export function useEffectiveLTV(collection: `0x${string}` | undefined, tokenId: bigint | undefined) {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "getEffectiveLTV",
    args: collection !== undefined && tokenId !== undefined ? [collection, tokenId] : undefined,
  });
}

/** Oracle risk tier for a specific token (1–3 typical). */
export function useTokenTier(
  collection: `0x${string}` | undefined,
  tokenId: bigint | undefined,
) {
  const chainId = useChainId();
  const addr = isHubEvm(chainId) ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "tokenTier",
    args: collection !== undefined && tokenId !== undefined ? [collection, tokenId] : undefined,
    query: { enabled: Boolean(addr && collection !== undefined && tokenId !== undefined) },
  });
}
