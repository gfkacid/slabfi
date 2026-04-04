import { useReadContract, useChainId } from "wagmi";
import { ORACLE_CONSUMER_ABI } from "@slabfinance/shared";
import { hubChain, hubContracts } from "@/lib/hub";

export function useOraclePrice(collection: `0x${string}` | undefined, tokenId: bigint | undefined) {
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "getPrice",
    args: collection !== undefined && tokenId !== undefined ? [collection, tokenId] : undefined,
  });
}

export function useEffectiveLTV(collection: `0x${string}` | undefined, tokenId: bigint | undefined) {
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "getEffectiveLTV",
    args: collection !== undefined && tokenId !== undefined ? [collection, tokenId] : undefined,
  });
}

/** Oracle risk tier for a collection (1–3 typical). */
export function useCollectionTier(collection: `0x${string}` | undefined) {
  const chainId = useChainId();
  const addr = chainId === hubChain.id ? hubContracts.oracleConsumer : undefined;

  return useReadContract({
    address: addr,
    abi: ORACLE_CONSUMER_ABI,
    functionName: "collectionTier",
    args: collection ? [collection] : undefined,
    query: { enabled: Boolean(addr && collection) },
  });
}
